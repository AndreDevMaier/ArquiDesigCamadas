package br.com.sistemas.chamados.exception;

/**Lançada quando um recurso procurado não existe (vira HTTP 404).*/

public class RecursoNaoEncontrado extends RuntimeException {
    public RecursoNaoEncontrado(String mensagem) {
        super(mensagem);
    }

}