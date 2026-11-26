import { getMediaAsset } from "@/content/repository";
import { NotFoundFlight } from "@/components/blocks/NotFoundFlight";

export default function NotFound() {
  const blueprint = getMediaAsset("hawker-blueprint-planform");
  return (
    <NotFoundFlight
      blueprintPath={blueprint.path}
      blueprintWidth={blueprint.width}
      blueprintHeight={blueprint.height}
    />
  );
}
