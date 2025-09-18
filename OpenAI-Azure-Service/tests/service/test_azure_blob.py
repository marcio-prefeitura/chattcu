from io import BytesIO
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.infrastructure.azure_blob.azure_blob import AzureBlob


class TestAzureBlob:

    @pytest.fixture
    def azure_blob(self):
        return AzureBlob()

    @pytest.mark.asyncio
    async def test_verifica_existencia_container(self, azure_blob):
        with patch(
            "src.infrastructure.azure_blob.azure_blob.AzureBlob._AzureBlob__get_blob_service_client",
            return_value=MagicMock(),
        ) as mock_get_client:
            mock_blob_service_client = mock_get_client.return_value
            mock_container_client = (
                mock_blob_service_client.get_container_client.return_value
            )

            mock_container_client.exists = AsyncMock(return_value=True)
            mock_container_client.close = AsyncMock()
            mock_blob_service_client.close = AsyncMock()

            result = await azure_blob.verifica_existencia_container("test_container")

            mock_get_client.assert_called_once()
            mock_blob_service_client.get_container_client.assert_called_once_with(
                container="test_container"
            )
            mock_container_client.exists.assert_awaited_once()
            mock_container_client.close.assert_awaited_once()
            mock_blob_service_client.close.assert_awaited_once()

            assert result is True

    @pytest.mark.asyncio
    async def test_verifica_existencia_container_nao_existe(self, azure_blob):
        with patch(
            "src.infrastructure.azure_blob.azure_blob.AzureBlob._AzureBlob__get_blob_service_client",
            return_value=MagicMock(),
        ) as mock_get_client:
            mock_blob_service_client = mock_get_client.return_value
            mock_container_client = (
                mock_blob_service_client.get_container_client.return_value
            )

            mock_container_client.exists = AsyncMock(return_value=False)
            mock_container_client.close = AsyncMock()
            mock_blob_service_client.close = AsyncMock()

            result = await azure_blob.verifica_existencia_container("test_container")

            mock_get_client.assert_called_once()
            mock_blob_service_client.get_container_client.assert_called_once_with(
                container="test_container"
            )
            mock_container_client.exists.assert_awaited_once()
            mock_container_client.close.assert_awaited_once()
            mock_blob_service_client.close.assert_awaited_once()

            assert result is False

    @pytest.mark.asyncio
    async def test_verifica_existencia_arquivo_container(self, azure_blob):
        with patch(
            "src.infrastructure.azure_blob.azure_blob.AzureBlob._AzureBlob__get_blob_service_client",
            return_value=MagicMock(),
        ) as mock_get_client:
            mock_blob_service_client = mock_get_client.return_value
            mock_container_client = (
                mock_blob_service_client.get_container_client.return_value
            )
            mock_blob_client = mock_container_client.get_blob_client.return_value

            mock_container_client.exists = AsyncMock(return_value=True)
            mock_blob_client.exists = AsyncMock(return_value=True)
            mock_container_client.close = AsyncMock()
            mock_blob_service_client.close = AsyncMock()
            mock_blob_client.close = AsyncMock()

            result = await azure_blob.verifica_existencia_arquivo_container(
                file_name="test_file", container_name="test_container"
            )

            assert result is True
            mock_blob_client.exists.assert_called_once()

    @pytest.mark.asyncio
    async def test_cria_container(self, azure_blob):
        with patch(
            "src.infrastructure.azure_blob.azure_blob.AzureBlob._AzureBlob__get_blob_service_client",
            return_value=MagicMock(),
        ) as mock_get_client:
            mock_container_client = (
                mock_get_client.return_value.get_container_client.return_value
            )
            mock_blob_service_client = mock_get_client.return_value
            mock_container_client.create_container = AsyncMock(return_value=None)
            mock_container_client.close = AsyncMock()
            mock_blob_service_client.close = AsyncMock()

            result = await azure_blob.cria_container("test_container")

            assert result is None
            mock_container_client.create_container.assert_called_once()

    @pytest.mark.asyncio
    async def test_upload_blob(self, azure_blob):
        with patch(
            "src.infrastructure.azure_blob.azure_blob.AzureBlob._AzureBlob__get_blob_service_client",
            return_value=MagicMock(),
        ) as mock_get_client:
            mock_blob_service_client = mock_get_client.return_value
            mock_container_client = (
                mock_blob_service_client.get_container_client.return_value
            )
            mock_blob_client = mock_container_client.get_blob_client.return_value

            mock_container_client.exists = AsyncMock(return_value=False)
            mock_container_client.upload_blob = AsyncMock(return_value=AsyncMock())
            mock_container_client.close = AsyncMock()
            mock_blob_service_client.close = AsyncMock()
            mock_blob_client.close = AsyncMock()

            result = await azure_blob.upload_blob(
                container_name="test_container",
                filename="test_file",
                data=BytesIO(b"test data"),
            )

            assert result is None
            mock_container_client.upload_blob.assert_called_once()

    @pytest.mark.asyncio
    async def test_recupera_blobs(self, azure_blob):
        with patch(
            "src.infrastructure.azure_blob.azure_blob.AzureBlob._AzureBlob__get_blob_service_client",
            return_value=MagicMock(),
        ) as mock_get_client:
            mock_blob_service_client = mock_get_client.return_value
            mock_container_client = (
                mock_blob_service_client.get_container_client.return_value
            )

            async def mock_list_blobs():
                blob1 = MagicMock()
                blob1.name = "blob1"
                blob2 = MagicMock()
                blob2.name = "blob2"
                yield blob1
                yield blob2

            mock_container_client.list_blobs = mock_list_blobs
            mock_container_client.exists = AsyncMock(return_value=True)
            mock_container_client.close = AsyncMock()
            mock_blob_service_client.close = AsyncMock()

            result = await azure_blob.recupera_blobs("test_container")

            assert result == ["blob1", "blob2"]

    @pytest.mark.asyncio
    async def test_download_blob(self, azure_blob):
        with patch(
            "src.infrastructure.azure_blob.azure_blob.AzureBlob._AzureBlob__get_blob_service_client",
            return_value=MagicMock(),
        ) as mock_get_client:
            mock_blob_service_client = mock_get_client.return_value
            mock_blob_client = mock_get_client.return_value.get_blob_client.return_value
            mock_blob_client.download_blob = AsyncMock(
                return_value=AsyncMock(readall=AsyncMock(return_value=b"data"))
            )
            mock_blob_client.close = AsyncMock()
            mock_blob_service_client.close = AsyncMock()

            with patch.object(
                azure_blob,
                "verifica_existencia_arquivo_container",
                return_value=AsyncMock(return_value=True),
            ):
                result = await azure_blob.download_blob(
                    container_name="test_container", filename="test_file"
                )

                assert result == b"data"
                mock_blob_client.download_blob.assert_called_once()

    @pytest.mark.asyncio
    async def test_download_blob_as_stream(self, azure_blob):
        with patch(
            "src.infrastructure.azure_blob.azure_blob.AzureBlob.download_blob",
            AsyncMock(return_value=b"data"),
        ) as mock_download_blob:
            result = await azure_blob.download_blob_as_stream(
                container_name="test_container", filename="test_file"
            )

            assert isinstance(result, BytesIO)
            assert result.read() == b"data"
            mock_download_blob.assert_called_once()
