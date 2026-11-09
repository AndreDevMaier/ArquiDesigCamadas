package br.com.sistemas.chamados.repository;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

import br.com.sistemas.chamados.entity.Categoria;

@DataJpaTest
class CategoriaRepositoryTest {

    @Autowired
    private CategoriaRepository repository;

    private Categoria nova(String nome) {
        Categoria c = new Categoria();
        c.setNome(nome);
        c.setDescricao("Descricao");
        return c;
    }

    @Test
    void deveSalvarEGerarId() {
        Categoria salva = repository.save(nova("Hardware"));
        assertThat(salva.getId()).isNotNull();
    }

    @Test
    void existsByNomeDeveRetornarTrueQuandoExiste() {
        repository.save(nova("Hardware"));
        assertThat(repository.existsByNome("Hardware")).isTrue();
    }

    @Test
    void existsByNomeDeveRetornarFalseQuandoNaoExiste() {
        assertThat(repository.existsByNome("Inexistente")).isFalse();
    }
}