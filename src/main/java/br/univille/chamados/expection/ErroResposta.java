package br.univille.chamados.expection;

import java.time.LocalDateTime;
import java.util.List;

public record ErroResposta(
    LocalDateTime momento,
    int status,
    String erro,
    List<String> detalhes 
) {}