from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.domain.llm.util.resumo_focado_utils import ResumoFocadoUtils


class TestResumoFocadoUtils:

    @patch("src.domain.llm.util.resumo_focado_utils.load_summarize_chain")
    @patch("src.domain.llm.util.resumo_focado_utils.PromptTemplate")
    @patch("src.domain.llm.util.resumo_focado_utils.logger")
    @pytest.mark.asyncio
    async def test_gerar_resumo_final_focado(
        self, mock_logger, mock_prompt_template, mock_load_summarize_chain
    ):
        utils = ResumoFocadoUtils()
        utils.llm = MagicMock()
        docs = ["doc1", "doc2"]
        preffix = "Prefixo"
        input_prompt = "Input Prompt"
        verbose = True
        return_intermediate_steps = True

        mock_prompt_template.from_template.side_effect = lambda x: x
        mock_chain = AsyncMock()
        mock_load_summarize_chain.return_value = mock_chain
        mock_chain.ainvoke.return_value = {"output_text": "Resumo final"}

        result = await utils._gerar_resumo_final_focado(
            docs,
            preffix=preffix,
            input_prompt=input_prompt,
            verbose=verbose,
            return_intermediate_steps=return_intermediate_steps,
        )

        assert result == {"output_text": "Resumo final"}
        mock_logger.info.assert_called()
        mock_prompt_template.from_template.assert_called()
        mock_load_summarize_chain.assert_called()
        mock_chain.ainvoke.assert_called_with(
            input={"input_documents": docs},
            return_only_outputs=(not return_intermediate_steps),
        )

    @patch("src.domain.llm.util.resumo_focado_utils.load_summarize_chain")
    @patch("src.domain.llm.util.resumo_focado_utils.PromptTemplate")
    @patch("src.domain.llm.util.resumo_focado_utils.logger")
    @pytest.mark.asyncio
    async def test_gerar_resumo_final_focado_not_input_prompt(
        self, mock_logger, mock_prompt_template, mock_load_summarize_chain
    ):
        utils = ResumoFocadoUtils()
        utils.llm = MagicMock()
        docs = ["doc1", "doc2"]
        verbose = True
        return_intermediate_steps = True

        mock_prompt_template.from_template.side_effect = lambda x: x
        mock_chain = AsyncMock()
        mock_load_summarize_chain.return_value = mock_chain
        mock_chain.ainvoke.return_value = {"output_text": "Resumo final"}

        result = await utils._gerar_resumo_final_focado(
            docs, verbose=verbose, return_intermediate_steps=return_intermediate_steps
        )

        assert result == {"output_text": "Resumo final"}
        mock_logger.info.assert_called()
        mock_prompt_template.from_template.assert_called()
        mock_load_summarize_chain.assert_called()
        mock_chain.ainvoke.assert_called_with(
            input={"input_documents": docs},
            return_only_outputs=(not return_intermediate_steps),
        )
