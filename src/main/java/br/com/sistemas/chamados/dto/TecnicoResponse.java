package br.com.sistemas.chamados.dto;

import br.com.sistemas.chamados.entity.Perfil;

public record TecnicoResponse(
    Long id,
    String nome,
    String email,
    Perfil perfil
){}