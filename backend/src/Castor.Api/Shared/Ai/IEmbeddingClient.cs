using Pgvector;

namespace Castor.Api.Shared;

/// <summary>
/// Embeddings behind an adapter chosen by <c>Embeddings:Provider</c>. The vector size comes from
/// <c>Embeddings:Dimensions</c> and is never hard-coded. Provider and model are still open — see docs/TODO.md.
/// </summary>
public interface IEmbeddingClient
{
    int Dimensions { get; }

    /// <returns>One vector per text, in the order of <paramref name="texts"/>.</returns>
    Task<IReadOnlyList<Vector>> EmbedAsync(IReadOnlyList<string> texts, CancellationToken cancellationToken);
}
