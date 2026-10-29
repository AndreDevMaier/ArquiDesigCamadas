package br.com.sistemas.chamados.controller;

import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.sistemas.chamados.dto.CategoriaRequest;
import br.com.sistemas.chamados.dto.CategoriaResponse;
import br.com.sistemas.chamados.exception.GlobalExceptionHandle;
import br.com.sistemas.chamados.exception.RecursoNaoEncontrado;
import br.com.sistemas.chamados.exception.RegraNegocioException;
import br.com.sistemas.chamados.service.CategoriaService;

@WebMvcTest(CategoriaController.class)
@Import(GlobalExceptionHandle.class)
class CategoriaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CategoriaService service;

    @Test
    void deveCriarCategoriaEDevolver201() throws Exception {
        when(service.criar(any(CategoriaRequest.class)))
                .thenReturn(new CategoriaResponse(1L, "Hardware", "Equipamentos"));

        mockMvc.perform(post("/categorias")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"Hardware\",\"descricao\":\"Equipamentos\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.nome").value("Hardware"));
    }

    @Test
    void deveDevolver400QuandoNomeVazio() throws Exception {
        mockMvc.perform(post("/categorias")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"\",\"descricao\":\"x\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void deveDevolver409QuandoNomeDuplicado() throws Exception {
        when(service.criar(any(CategoriaRequest.class)))
                .thenThrow(new RegraNegocioException("Já existe uma categoria com esse nome"));

        mockMvc.perform(post("/categorias")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"Hardware\",\"descricao\":\"x\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    void deveDevolver404QuandoIdNaoExiste() throws Exception {
        when(service.buscarPorId(eq(999L)))
                .thenThrow(new RecursoNaoEncontrado("Categoria não encontrada"));

        mockMvc.perform(get("/categorias/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }
}