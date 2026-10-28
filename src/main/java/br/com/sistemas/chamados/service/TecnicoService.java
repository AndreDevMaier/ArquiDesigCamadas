package br.com.sistemas.chamados.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.sistemas.chamados.dto.TecnicoRequest;
import br.com.sistemas.chamados.dto.TecnicoResponse;
import br.com.sistemas.chamados.entity.Tecnico;
import br.com.sistemas.chamados.exception.RecursoNaoEncontrado;
import br.com.sistemas.chamados.exception.RegraNegocioException;
import br.com.sistemas.chamados.repository.TecnicoRepository;

@Service
public class TecnicoService {

    private final TecnicoRepository repository;

    public TecnicoService(TecnicoRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public TecnicoResponse criar(TecnicoRequest request) {
        if (repository.existsByEmail(request.email())) {
            throw new RegraNegocioException("Já existe um técnico com esse e-mail");
        }
        Tecnico tecnico = new Tecnico();
        preencher(tecnico, request);
        return toResponse(repository.save(tecnico));
    }

    @Transactional(readOnly = true)
    public List<TecnicoResponse> listar() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public TecnicoResponse buscarPorId(Long id) {
        return toResponse(buscarEntidade(id));
    }

    @Transactional
    public TecnicoResponse atualizar(Long id, TecnicoRequest request) {
        Tecnico tecnico = buscarEntidade(id);
        if (repository.existsByEmailAndIdNot(request.email(), id)) {
            throw new RegraNegocioException("Já existe um técnico com esse e-mail");
        }
        preencher(tecnico, request);
        return toResponse(repository.save(tecnico));
    }

    @Transactional
    public void deletar(Long id) {
        repository.delete(buscarEntidade(id));
    }

    private Tecnico buscarEntidade(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontrado("Técnico não encontrado"));
    }

    private void preencher(Tecnico tecnico, TecnicoRequest request) {
        tecnico.setNome(request.nome());
        tecnico.setEmail(request.email());
        tecnico.setPerfil(request.perfil());
    }

    private TecnicoResponse toResponse(Tecnico t) {
        return new TecnicoResponse(t.getId(), t.getNome(), t.getEmail(), t.getPerfil());
    }
}