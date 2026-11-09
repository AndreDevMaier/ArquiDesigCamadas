package br.com.sistemas.chamados.entity;

public enum StatusChamado {
    ABERTO,
    EM_ATENDIMENTO,
    AGUARDANDO_CLIENTE,
    FECHADO;

    public boolean podeIrPara(StatusChamado novo) {
        return switch (this) {
            case ABERTO -> novo == EM_ATENDIMENTO;
            case EM_ATENDIMENTO -> novo == AGUARDANDO_CLIENTE || novo == FECHADO;
            case AGUARDANDO_CLIENTE -> novo == EM_ATENDIMENTO || novo == FECHADO;
            case FECHADO -> false;
        };
    }
}