import logging

from langchain.chains.summarize import load_summarize_chain
from langchain_core.prompts import PromptTemplate

logger = logging.getLogger(__name__)


class ResumoFocadoUtils:

    async def _gerar_resumo_final_focado(
        self,
        docs,
        preffix=None,
        input_prompt=None,
        verbose=False,
        return_intermediate_steps=False,
    ):
        logger.info(">> Gerando o resumo final - focado")

        if preffix and input_prompt:
            prompt_template = preffix + ": \n" + "{text}\n" + input_prompt + ":"
        else:
            prompt_template = """Escreva um resumo conciso do seguinte:
                {text}
                RESUMO CONCISO:"""

        prompt = PromptTemplate.from_template(prompt_template)
        logger.info(prompt)

        refine_template = (
            "A sua tarefa é produzir um resumo final\n"
            "Fornecemos um resumo existente até um certo ponto: {existing_answer}\n"
            "Temos a oportunidade de refinar o resumo existente"
            "(apenas se necessário) com mais algum contexto abaixo.\n"
            "------------\n"
            "{text}\n"
            "------------\n"
            "Dado o novo contexto, refine o resumo original em Português do Brasil. "
            "Se o contexto não for útil, retorne o resumo original."
        )
        refine_prompt = PromptTemplate.from_template(refine_template)

        chain = load_summarize_chain(
            llm=self.llm,
            chain_type="refine",
            question_prompt=prompt,
            refine_prompt=refine_prompt,
            return_intermediate_steps=return_intermediate_steps,
            input_key="input_documents",
            output_key="output_text",
            verbose=verbose,
        )

        result = await chain.ainvoke(
            input={"input_documents": docs},
            return_only_outputs=(not return_intermediate_steps),
        )

        return result
