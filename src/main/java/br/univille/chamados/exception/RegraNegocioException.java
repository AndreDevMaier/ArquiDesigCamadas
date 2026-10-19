package br.univille.chamados.exception;

/**Lançada quando uma regra de negócio é violada (vira HTTP 400).*/
public class RegraNegocioException extends RuntimeException {
    public RegraNegocioException(String mensagem) {
        super(mensagem);
    }
}