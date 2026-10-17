import { Card } from "@/components/ui/card";
import type { StudyCard } from "@/lib/study";
import { RichContent } from "@/components/editor/rich-content";
import { Icon } from "@/components/icon";
export function ReviewCard({
  card,
  revealed,
}: {
  card: StudyCard;
  revealed: boolean;
}) {
  return (
    <Card
      role="article"
      className={`review-card ${revealed ? "is-revealed" : ""}`}
      key={card.id}
    >
      <span className="review-label">TAKE A MOMENT TO RECALL</span>
      <div className="rich-question" role="heading" aria-level={1}>
        <RichContent
          eagerImages
          document={card.questionRich}
          text={card.question}
        />
      </div>
      {revealed && (
        <div className="answer-reveal">
          <span className="review-label">THE ANSWER</span>
          <RichContent
            eagerImages
            document={card.answerRich}
            text={card.answer}
          />
        </div>
      )}
      {!revealed && (
        <div className="recall-prompt">
          <Icon name="spark" size={20} />
          <p>Let the answer come to you.</p>
        </div>
      )}
    </Card>
  );
}
