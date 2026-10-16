package br.univille.chamados.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.univille.chamados.dto.ClienteRequest;
import br.univille.chamados.dto.ClienteResponse;
import br.univille.chamados.service.ClienteService;
import jakarta.validation.Valid;    

@RestController
@RequestMapping("/cliente")
public class ClienteController {

    private final ClienteService service;

    public ClienteController(ClienteService service) {
        this.service = service;
    }
    @PostMapping
    public ResponseEntity<ClienteResponse>criar (
    @Valid @RequestBody ClienteRequest dto) {
    ClienteResponse criado = service.criar(dto);
    return ResponseEntity.created(URI.create("/clientes/" + criado.id())). body(criado);

    }
    @GetMapping
    public List<ClienteResponse> listar() {
        return service.listar();
    }
    @GetMapping("/{id}")
    public ClienteResponse buscar(@PathVariable Long id) {
        return service.buscar(id);
    }
    @PutMapping("/{id}")
    public br.univille.chamados.dto.ClienteResponse atualizar (
        @PathVariable Long id,
        @Valid @RequestBody ClienteRequest dto) {
        return service.atualizar(id, dto);
        }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir (@PathVariable Long id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}