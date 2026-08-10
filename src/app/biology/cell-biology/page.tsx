import BiologyTopicPage from "@/components/topic/BiologyTopicPage";
import { cellBiologyConfig } from "@/data/topics/cell-biology";

export default function CellBiologyPage() {
  return <BiologyTopicPage config={cellBiologyConfig} />;
}
