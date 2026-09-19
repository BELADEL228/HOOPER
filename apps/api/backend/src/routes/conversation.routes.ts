import { Router } from 'express';
import { ConversationController } from '../controllers/conversation.controller';
import { requireAuth } from '../middlewares/auth.middleware';

export const conversationRouter = Router();

// Liste des conversations de l'utilisateur
conversationRouter.get('/', requireAuth, ConversationController.listMyConversations);

// Créer une nouvelle conversation (DIRECT ou GROUP)
conversationRouter.post('/', requireAuth, ConversationController.createConversation);

// Historique des messages d'une conversation
conversationRouter.get('/:id/messages', requireAuth, ConversationController.getMessages);

// Envoyer un message (fallback REST si socket indisponible)
conversationRouter.post('/:id/messages', requireAuth, ConversationController.sendMessage);

// Marquer une conversation comme lue
conversationRouter.post('/:id/read', requireAuth, ConversationController.markAsRead);

// Supprimer un message
conversationRouter.delete('/:id/messages/:messageId', requireAuth, ConversationController.deleteMessage);