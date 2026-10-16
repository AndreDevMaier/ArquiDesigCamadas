package br.univille.chamados.repository;

import br.univille.chamados.entity.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    boolean existeByEmail(String email);
    boolean existeByEmailAndIdNot(String email, Long id);
}