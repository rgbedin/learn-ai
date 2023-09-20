import { kmeans } from "ml-kmeans";
import { norm2, sub } from "numeric";
import { type Chunk } from "./createChunks";

export function runKmeans(
  vectors: number[][],
  chunks: Chunk[],
  numClusters = 8,
) {
  console.debug("Running K-means clustering", {
    vectors: vectors.length,
    numClusters,
  });

  if (chunks.length !== vectors.length) {
    throw new Error("Chunks and vectors should have the same length.");
  }

  const result = kmeans(vectors, numClusters, {});
  const res = result.computeInformation(vectors);

  // Extract representative chunk for each cluster
  const representatives: Chunk[] = [];

  for (let i = 0; i < numClusters; i++) {
    const centroid = res[i]!.centroid;
    let closestDistance = Infinity;
    let closestIndex = -1;

    // Find the closest vector to the centroid
    for (let j = 0; j < vectors.length; j++) {
      if (result.clusters[j] === i) {
        const distance = norm2(sub(centroid, vectors[j]!));
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = j;
        }
      }
    }

    if (closestIndex !== -1) {
      representatives.push(chunks[closestIndex]!);
    }
  }

  console.debug("Representative chunks found", representatives.length);

  return representatives;
}
