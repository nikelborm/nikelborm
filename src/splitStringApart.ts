export function splitStringApart({
  initialStringToSplit,
  startToken,
  endToken,
}: {
  initialStringToSplit: string,
  startToken: string,
  endToken: string,
}) {
  const startingToken1stCharPos = initialStringToSplit.indexOf(startToken);
  const endingToken1stCharPos = initialStringToSplit.indexOf(endToken);

  if (startingToken1stCharPos === -1)
    throw new Error('START marker is missing');

  if (endingToken1stCharPos === -1)
    throw new Error('END marker is missing');

  if (startingToken1stCharPos > endingToken1stCharPos)
    throw new Error(
      'START marker cannot be set after END marker. START marker should go first.'
    );

  const editableZoneStartsAt = startingToken1stCharPos + startToken.length;
  const editableZoneEndsAt = endingToken1stCharPos;

  return {
    leftPartWithStartToken: initialStringToSplit.slice(0, editableZoneStartsAt),
    middlePartWithoutTokens: initialStringToSplit.slice(editableZoneStartsAt, editableZoneEndsAt),
    rightPartWithEndToken: initialStringToSplit.slice(editableZoneEndsAt)
  }
}
