package br.univille.chamados.dto;

import br.univille.chamados.entity.Cliente;

public record ClienteResponse(Long id, String nome, String email, String telefone) {
    public ClienteResponse(Cliente c) {
        this(c.getId(), c.getNome(), c.getEmail(), c.getTelefone());
    }
}
