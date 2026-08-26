import { useCallback, useState } from "react";
import {
  createFeedback,
  loadFeedback,
  updateFeedbackStatus,
  type FeedbackStatus,
  type FeedbackType,
  type UserFeedback
} from "@/lib/feedback-service";

export function useFeedback() {
  const [feedbackList, setFeedbackList] = useState<UserFeedback[]>([]);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const reloadFeedback = useCallback(async () => {
    const data = await loadFeedback();
    setFeedbackList(data);
    return data;
  }, []);

  const submitFeedback = useCallback(
    async (input: { createdById: string | null; createdByEmail: string; type: FeedbackType; content: string; contextModule: string | null }) => {
      await createFeedback(input);
      setIsFeedbackModalOpen(false);
    },
    []
  );

  const changeFeedbackStatus = useCallback(async (id: string, status: FeedbackStatus, adminNote?: string) => {
    await updateFeedbackStatus(id, status, adminNote);
    await reloadFeedback();
  }, [reloadFeedback]);

  return {
    feedbackList,
    isFeedbackModalOpen,
    feedbackError,
    setIsFeedbackModalOpen,
    setFeedbackError,
    reloadFeedback,
    submitFeedback,
    changeFeedbackStatus
  };
}
