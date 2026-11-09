package br.com.sistemas.chamados.repository;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

import br.com.sistemas.chamados.entity.Perfil;
import br.com.sistemas.chamados.entity.Tecnico;

@DataJpaTest
class TecnicoRepositoryTest {

    @Autowired
    private TecnicoRepository repository;

    private Tecnico novo(String email) {
        Tecnico t = new Tecnico();
        t.setNome("Carlos Silva");
        t.setEmail(email);
        t.setPerfil(Perfil.TECNICO);
        return t;
    }

    @Test
    void deveSalvarEGerarId() {
        assertThat(repository.save(novo("carlos@exemplo.com")).getId()).isNotNull();
    }

    @Test
    void existsByEmailDeveDetectarDuplicidade() {
        repository.save(novo("carlos@exemplo.com"));
        assertThat(repository.existsByEmail("carlos@exemplo.com")).isTrue();
        assertThat(repository.existsByEmail("outro@exemplo.com")).isFalse();
    }

    @Test
    void existsByEmailAndIdNotDeveIgnorarOProprioRegistro() {
        Tecnico salvo = repository.save(novo("carlos@exemplo.com"));
        assertThat(repository.existsByEmailAndIdNot("carlos@exemplo.com", salvo.getId())).isFalse();
        assertThat(repository.existsByEmailAndIdNot("carlos@exemplo.com", 999L)).isTrue();
    }
}