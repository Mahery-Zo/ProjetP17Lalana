/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from "firebase-functions/v2";
import { onRequest } from "firebase-functions/v2/https";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

/**
 * Envoyer une notification quand le statut d'un signalement change
 */
export const onSignalementStatusChange = onDocumentUpdated(
  "signalements/{signalementId}",
  (event) => {
    const { signalementId } = event.params;
    const beforeData = event.data?.before;
    const afterData = event.data?.after;

    // Vérifier si le statut a changé
    if (!beforeData || !afterData || beforeData.get("status") === afterData.get("status")) {
      return null;
    }

    const userId = afterData.get("userId");
    const status = afterData.get("status");

    if (!userId) {
      logger.log("No userId found, skipping notification");
      return null;
    }

    try {
      // Préparer la notification
      const notificationBody = `Le statut de votre signalement est maintenant: ${getStatusText(
        status,
      )}`;

      logger.log(`Notification sent for signalement ${signalementId} to user ${userId}: ${notificationBody}`);
      return { success: true };
    } catch (error) {
      logger.error("Error sending notification:", error);
      return null;
    }
  },
);

/**
 * Fonction utilitaire pour obtenir le texte du statut
 * @param status - Le statut du signalement
 * @returns Le texte formaté du statut
 */
function getStatusText(status: string): string {
  const statusMap: { [key: string]: string } = {
    "nouveau": "Nouveau",
    "en_cours": "En cours de traitement",
    "termine": "Terminé",
  };
  return statusMap[status] || status;
}

/**
 * Test function pour envoyer des notifications de test
 */
export const sendTestNotification = onRequest({
  cors: true,
}, (request, response) => {
  const userId = request.query.userId;

  if (!userId) {
    response.status(400).json({ error: "userId parameter is required" });
    return;
  }

  try {
    const notificationBody = "Ceci est une notification de test pour vérifier que tout fonctionne!";

    response.status(200).json({
      success: true,
      message: "Test notification sent",
      body: notificationBody,
    });
  } catch (error) {
    logger.error("Error sending test notification:", error);
    response.status(500).json({ error: "Error sending test notification" });
  }
});
