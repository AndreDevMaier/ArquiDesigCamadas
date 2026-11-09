package br.com.sistemas.chamados.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.sistemas.chamados.dto.AlterarStatusRequest;
import br.com.sistemas.chamados.dto.AtribuirTecnicoRequest;
import br.com.sistemas.chamados.dto.ChamadoDetalheResponse;
import br.com.sistemas.chamados.dto.ChamadoRequest;
import br.com.sistemas.chamados.dto.ChamadoResponse;
import br.com.sistemas.chamados.dto.ComentarioRequest;
import br.com.sistemas.chamados.dto.ComentarioResponse;
import br.com.sistemas.chamados.entity.Categoria;
import br.com.sistemas.chamados.entity.Chamado;
import br.com.sistemas.chamados.entity.Cliente;
import br.com.sistemas.chamados.entity.Comentario;
import br.com.sistemas.chamados.entity.Prioridade;
import br.com.sistemas.chamados.entity.StatusChamado;
import br.com.sistemas.chamados.entity.Tecnico;
import br.com.sistemas.chamados.exception.ChamadoFechadoException;
import br.com.sistemas.chamados.exception.RecursoNaoEncontrado;
import br.com.sistemas.chamados.exception.TransicaoStatusInvalidaException;
import br.com.sistemas.chamados.repository.CategoriaRepository;
import br.com.sistemas.chamados.repository.ChamadoRepository;
import br.com.sistemas.chamados.repository.ClienteRepository;
import br.com.sistemas.chamados.repository.ComentarioRepository;
import br.com.sistemas.chamados.repository.TecnicoRepository;

@Service
public class ChamadoService {

    private final ChamadoRepository repository;
    private final ClienteRepository clienteRepository;
    private final CategoriaRepository categoriaRepository;
    private final TecnicoRepository tecnicoRepository;
    private final ComentarioRepository comentarioRepository;

    public ChamadoService(ChamadoRepository repository,
                          ClienteRepository clienteRepository,
                          CategoriaRepository categoriaRepository,
                          TecnicoRepository tecnicoRepository,
                          ComentarioRepository comentarioRepository) {
        this.repository = repository;
        this.clienteRepository = clienteRepository;
        this.categoriaRepository = categoriaRepository;
        this.tecnicoRepository = tecnicoRepository;
        this.comentarioRepository = comentarioRepository;
    }

    @Transactional
    public ChamadoResponse criar(ChamadoRequest request) {
        Chamado chamado = new Chamado();
        chamado.setStatus(StatusChamado.ABERTO);
        chamado.setDataAbertura(LocalDateTime.now());
        preencher(chamado, request);
        return toResponse(repository.save(chamado));
    }

    @Transactional(readOnly = true)
    public Page<ChamadoResponse> listar(StatusChamado status, Prioridade prioridade,
                                        Long clienteId, Pageable pageable) {
        return repository.filtrar(status, prioridade, clienteId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<ChamadoResponse> listarPorCliente(Long clienteId, Pageable pageable) {
        if (!clienteRepository.existsById(clienteId)) {
            throw new RecursoNaoEncontrado("Cliente não encontrado");
        }
        return repository.filtrar(null, null, clienteId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public ChamadoDetalheResponse detalhar(Long id) {
        Chamado chamado = buscarEntidade(id);
        List<ComentarioResponse> comentarios = comentarioRepository
                .findByChamadoIdOrderByDataAsc(id).stream()
                .map(this::toComentarioResponse).toList();
        return new ChamadoDetalheResponse(toResponse(chamado), comentarios);
    }

    @Transactional
    public ComentarioResponse comentar(Long chamadoId, ComentarioRequest request) {
        Chamado chamado = buscarEntidade(chamadoId);
        Comentario comentario = new Comentario();
        comentario.setTexto(request.texto());
        comentario.setAutor(request.autor());
        comentario.setData(LocalDateTime.now());
        comentario.setChamado(chamado);
        return toComentarioResponse(comentarioRepository.save(comentario));
    }

    @Transactional
    public ChamadoResponse atualizar(Long id, ChamadoRequest request) {
        Chamado chamado = buscarEntidade(id);
        garantirAberto(chamado);
        preencher(chamado, request);
        if (request.status() != null && request.status() != chamado.getStatus()) {
            aplicarStatus(chamado, request.status());
        }
        return toResponse(repository.save(chamado));
    }

    @Transactional
    public ChamadoResponse atribuir(Long id, AtribuirTecnicoRequest request) {
        Chamado chamado = buscarEntidade(id);
        garantirAberto(chamado);
        Tecnico tecnico = tecnicoRepository.findById(request.tecnicoId())
                .orElseThrow(() -> new RecursoNaoEncontrado("Técnico não encontrado"));
        chamado.setTecnico(tecnico);
        return toResponse(repository.save(chamado));
    }

    @Transactional
    public ChamadoResponse alterarStatus(Long id, AlterarStatusRequest request) {
        Chamado chamado = buscarEntidade(id);
        garantirAberto(chamado);
        aplicarStatus(chamado, request.status());
        return toResponse(repository.save(chamado));
    }

    @Transactional
    public void deletar(Long id) {
        Chamado chamado = buscarEntidade(id);
        comentarioRepository.deleteByChamadoId(id);
        repository.delete(chamado);
    }

    private Chamado buscarEntidade(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontrado("Chamado não encontrado"));
    }

    private void garantirAberto(Chamado chamado) {
        if (chamado.getStatus() == StatusChamado.FECHADO) {
            throw new ChamadoFechadoException("Chamado fechado não pode ser alterado");
        }
    }

    private void aplicarStatus(Chamado chamado, StatusChamado novo) {
        if (!chamado.getStatus().podeIrPara(novo)) {
            throw new TransicaoStatusInvalidaException(
                    "Transição inválida: " + chamado.getStatus() + " para " + novo);
        }
        chamado.setStatus(novo);
        if (novo == StatusChamado.FECHADO) {
            chamado.setDataFechamento(LocalDateTime.now());
        }
    }

    private void preencher(Chamado chamado, ChamadoRequest request) {
        Cliente cliente = clienteRepository.findById(request.clienteId())
                .orElseThrow(() -> new RecursoNaoEncontrado("Cliente não encontrado"));
        Categoria categoria = categoriaRepository.findById(request.categoriaId())
                .orElseThrow(() -> new RecursoNaoEncontrado("Categoria não encontrada"));
        Tecnico tecnico = null;
        if (request.tecnicoId() != null) {
            tecnico = tecnicoRepository.findById(request.tecnicoId())
                    .orElseThrow(() -> new RecursoNaoEncontrado("Técnico não encontrado"));
        }
        chamado.setTitulo(request.titulo());
        chamado.setDescricao(request.descricao());
        chamado.setPrioridade(request.prioridade());
        chamado.setCliente(cliente);
        chamado.setCategoria(categoria);
        chamado.setTecnico(tecnico);
    }

    private ChamadoResponse toResponse(Chamado c) {
        Tecnico t = c.getTecnico();
        return new ChamadoResponse(
                c.getId(), c.getTitulo(), c.getDescricao(),
                c.getDataAbertura(), c.getDataFechamento(),
                c.getPrioridade(), c.getStatus(),
                c.getCliente().getId(), c.getCliente().getNome(),
                c.getCategoria().getId(), c.getCategoria().getNome(),
                t != null ? t.getId() : null,
                t != null ? t.getNome() : null);
    }

    private ComentarioResponse toComentarioResponse(Comentario c) {
        return new ComentarioResponse(c.getId(), c.getTexto(), c.getAutor(), c.getData());
    }
}