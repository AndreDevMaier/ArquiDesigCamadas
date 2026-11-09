package br.com.sistemas.chamados.exception;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandle {

    @ExceptionHandler(RecursoNaoEncontrado.class)
    public ResponseEntity<ErroResposta> naoEncontrado (RecursoNaoEncontrado ex) {
        return montar(HttpStatus.NOT_FOUND, ex.getMessage(), List.of());
    }
    @ExceptionHandler (RegraNegocioException.class)
    public ResponseEntity<ErroResposta> regraNegocio (RegraNegocioException ex) {
        return montar(HttpStatus.CONFLICT, ex.getMessage(), List.of());
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErroResposta> validacao(MethodArgumentNotValidException ex) {
        List<String> detalhes = ex.getBindingResult().getFieldErrors().stream()
            .map(erro -> erro.getField() + ": " + erro.getDefaultMessage())
            .toList();
        return montar(HttpStatus.BAD_REQUEST, "Erro de validação", detalhes);
    }

    private ResponseEntity<ErroResposta> montar(HttpStatus status, String erro, List<String> detalhes) {
        return ResponseEntity.status(status).body(new ErroResposta(LocalDateTime.now(), status.value(), erro, detalhes));
    
    }
    @ExceptionHandler(ChamadoFechadoException.class)
public ResponseEntity<ErroResposta> chamadoFechado(ChamadoFechadoException ex) {
    return montar(HttpStatus.CONFLICT, ex.getMessage(), List.of());
}

@ExceptionHandler(TransicaoStatusInvalidaException.class)
public ResponseEntity<ErroResposta> transicaoInvalida(TransicaoStatusInvalidaException ex) {
    return montar(HttpStatus.CONFLICT, ex.getMessage(), List.of());
}
}