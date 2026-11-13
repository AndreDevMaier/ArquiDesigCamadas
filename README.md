# Sistema de Chamados

Sistema web para abrir e acompanhar chamados de suporte. Trabalho da disciplina de Arquitetura e Design em Camadas.

**Autor:** André Maier

## Sobre o projeto

Com o sistema é possível cadastrar clientes, categorias e técnicos, abrir chamados, mudar o status deles, atribuir um técnico e adicionar comentários. Ao subir, ele já vem com alguns dados de exemplo.

O projeto tem duas partes que rodam juntas:

- **API REST** em Java com Spring Boot, organizada em camadas (controller, service, repository, entity, dto e exception).
- **Telas** em HTML, CSS e JavaScript, com 5 páginas: Chamados, Clientes, Categorias, Técnicos e Comentários.

## Tecnologias

- Java 21
- Spring Boot 4.1.1 (Web, Data JPA e Validation)
- Banco H2 (em memória)
- Maven (já incluso no projeto pelo `mvnw`)
- HTML, CSS e JavaScript

## Como rodar

É preciso ter o **JDK 21** instalado. Confira com:

```
java -version
```

Baixe o projeto e entre na pasta:

```
git clone https://github.com/AndreDevMaier/ArquiDesigCamadas.git
cd ArquiDesigCamadas
```

Rode a aplicação.

No Windows (PowerShell):

```
.\mvnw.cmd spring-boot:run
```

No Linux ou macOS:

```
./mvnw spring-boot:run
```

Quando aparecer `Started ChamadosApplication`, abra no navegador:

```
http://localhost:8080/
```

Para parar, use `Ctrl+C` no terminal.

> O banco é em memória, então os dados voltam ao estado inicial sempre que a aplicação é reiniciada.

## Como rodar os testes

```
.\mvnw.cmd clean test
```

O resultado esperado é `BUILD SUCCESS`.

## Links úteis

| O quê | Endereço |
|---|---|
| Telas do sistema | http://localhost:8080/ |
| Console do banco H2 | http://localhost:8080/h2-console |

No console do H2, use a URL `jdbc:h2:mem:chamadosdb`, usuário `sa` e senha em branco.
