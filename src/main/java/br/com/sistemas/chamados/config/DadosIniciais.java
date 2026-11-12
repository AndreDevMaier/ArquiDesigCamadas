package br.com.sistemas.chamados.config;

import java.time.LocalDateTime;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import br.com.sistemas.chamados.entity.Categoria;
import br.com.sistemas.chamados.entity.Chamado;
import br.com.sistemas.chamados.entity.Cliente;
import br.com.sistemas.chamados.entity.Comentario;
import br.com.sistemas.chamados.entity.Perfil;
import br.com.sistemas.chamados.entity.Prioridade;
import br.com.sistemas.chamados.entity.StatusChamado;
import br.com.sistemas.chamados.entity.Tecnico;
import br.com.sistemas.chamados.repository.CategoriaRepository;
import br.com.sistemas.chamados.repository.ChamadoRepository;
import br.com.sistemas.chamados.repository.ClienteRepository;
import br.com.sistemas.chamados.repository.ComentarioRepository;
import br.com.sistemas.chamados.repository.TecnicoRepository;

/**
 * Popula o banco H2 (que começa vazio a cada reinício) com dados de
 * demonstração. Só roda se ainda não existir nenhuma categoria.
 */
@Component
public class DadosIniciais implements CommandLineRunner {

    private final CategoriaRepository categorias;
    private final ClienteRepository clientes;
    private final TecnicoRepository tecnicos;
    private final ChamadoRepository chamados;
    private final ComentarioRepository comentarios;

    public DadosIniciais(CategoriaRepository categorias,
                         ClienteRepository clientes,
                         TecnicoRepository tecnicos,
                         ChamadoRepository chamados,
                         ComentarioRepository comentarios) {
        this.categorias = categorias;
        this.clientes = clientes;
        this.tecnicos = tecnicos;
        this.chamados = chamados;
        this.comentarios = comentarios;
    }

    @Override
    public void run(String... args) {
        if (categorias.count() > 0) {
            return;
        }

        // ---------- Categorias ----------
        Categoria hardware = categoria("Hardware", "Computadores, periféricos e equipamentos");
        Categoria software = categoria("Software", "Sistemas, instalação e erros de aplicativos");
        Categoria rede = categoria("Rede", "Internet, Wi-Fi e acesso a servidores");

        // ---------- Clientes ----------
        Cliente maria = clientes.save(new Cliente("Maria Souza", "maria@email.com", "(47) 99999-0001"));
        Cliente joao = clientes.save(new Cliente("João Pereira", "joao@email.com", "(47) 99999-0002"));
        Cliente paula = clientes.save(new Cliente("Paula Lima", "paula@email.com", null));

        // ---------- Técnicos ----------
        Tecnico carlos = tecnico("Carlos Lima", "carlos@empresa.com", Perfil.TECNICO);
        Tecnico ana = tecnico("Ana Costa", "ana@empresa.com", Perfil.ADMIN);

        // ---------- Chamados (um em cada status) ----------
        LocalDateTime agora = LocalDateTime.now();

        Chamado c1 = chamado("Computador não liga",
                "O computador da recepção não dá sinal de vida ao apertar o botão.",
                Prioridade.ALTA, StatusChamado.ABERTO,
                agora.minusHours(2), null, maria, hardware, null);

        Chamado c2 = chamado("Erro ao acessar o sistema",
                "Aparece a mensagem de credenciais inválidas mesmo com a senha correta.",
                Prioridade.CRITICA, StatusChamado.EM_ATENDIMENTO,
                agora.minusDays(1), null, joao, software, carlos);

        Chamado c3 = chamado("Wi-Fi caindo no segundo andar",
                "A conexão cai a cada poucos minutos. Aguardando o cliente informar o horário exato.",
                Prioridade.MEDIA, StatusChamado.AGUARDANDO_CLIENTE,
                agora.minusDays(2), null, paula, rede, ana);

        Chamado c4 = chamado("Solicitar novo mouse",
                "O mouse atual está com o botão esquerdo falhando.",
                Prioridade.BAIXA, StatusChamado.FECHADO,
                agora.minusDays(5), agora.minusDays(4), maria, hardware, carlos);

        chamado("Instalar pacote de escritório",
                "Instalar o pacote de escritório no notebook novo.",
                Prioridade.MEDIA, StatusChamado.ABERTO,
                agora.minusMinutes(30), null, joao, software, null);

        // ---------- Comentários ----------
        comentario(c2, "Carlos Lima", "Reiniciei o serviço de autenticação, mas o erro continua.", agora.minusHours(20));
        comentario(c2, "João Pereira", "Testei em outro navegador e deu o mesmo erro.", agora.minusHours(18));
        comentario(c3, "Ana Costa", "Pode me informar em quais horários a queda acontece?", agora.minusDays(1));
        comentario(c4, "Carlos Lima", "Mouse trocado e testado. Chamado encerrado.", agora.minusDays(4));
        comentario(c1, "Maria Souza", "O computador está ligado na tomada e o cabo foi testado.", agora.minusHours(1));
    }

    private Categoria categoria(String nome, String descricao) {
        Categoria c = new Categoria();
        c.setNome(nome);
        c.setDescricao(descricao);
        return categorias.save(c);
    }

    private Tecnico tecnico(String nome, String email, Perfil perfil) {
        Tecnico t = new Tecnico();
        t.setNome(nome);
        t.setEmail(email);
        t.setPerfil(perfil);
        return tecnicos.save(t);
    }

    private Chamado chamado(String titulo, String descricao, Prioridade prioridade,
                            StatusChamado status, LocalDateTime abertura,
                            LocalDateTime fechamento, Cliente cliente,
                            Categoria categoria, Tecnico tecnico) {
        Chamado c = new Chamado();
        c.setTitulo(titulo);
        c.setDescricao(descricao);
        c.setPrioridade(prioridade);
        c.setStatus(status);
        c.setDataAbertura(abertura);
        c.setDataFechamento(fechamento);
        c.setCliente(cliente);
        c.setCategoria(categoria);
        c.setTecnico(tecnico);
        return chamados.save(c);
    }

    private void comentario(Chamado chamado, String autor, String texto, LocalDateTime data) {
        Comentario c = new Comentario();
        c.setChamado(chamado);
        c.setAutor(autor);
        c.setTexto(texto);
        c.setData(data);
        comentarios.save(c);
    }
}