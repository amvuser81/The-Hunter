'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { AppSidebar } from '../chat/components/app-sidebar.js';
import { SidebarProvider, SidebarInset } from '../chat/components/ui/sidebar.js';
import { ChatNavProvider } from '../chat/components/chat-nav-context.js';
import { ChatHeader } from '../chat/components/chat-header.js';
import { ConfirmDialog } from '../chat/components/ui/confirm-dialog.js';
import { ensureCodeWorkspaceContainer, closeInteractiveMode, getContainerGitStatus } from './actions.js';

const TerminalView = dynamic(() => import('./terminal-view.js'), { ssr: false });

export default function CodePage({ session, codeWorkspaceId }) {
  const [dialogState, setDialogState] = useState('closed'); // 'closed' | 'loading' | 'safe' | 'warning' | 'error'
  const [gitStatus, setGitStatus] = useState(null);
  const [closing, setClosing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleOpenCloseDialog = useCallback(async () => {
    setDialogState('loading');
    setGitStatus(null);
    setErrorMessage('');
    try {
      const status = await getContainerGitStatus(codeWorkspaceId);
      setGitStatus(status);
      if (status?.hasUnsavedWork) {
        setDialogState('warning');
      } else {
        setDialogState('safe');
      }
    } catch (err) {
      console.error('[CodePage] Failed to check git status:', err);
      setDialogState('safe'); // fallback to simple confirm
    }
  }, [codeWorkspaceId]);

  const handleConfirmClose = useCallback(async () => {
    setClosing(true);
    setErrorMessage('');
    try {
      const result = await closeInteractiveMode(codeWorkspaceId);
      if (result?.success) {
        window.location.href = result.chatId ? `/chat/${result.chatId}` : '/';
      } else {
        const msg = result?.message || 'Failed to close session';
        console.error('[CodePage] closeInteractiveMode failed:', msg);
        setErrorMessage(msg);
        setDialogState('error');
        setClosing(false);
      }
    } catch (err) {
      console.error('[CodePage] closeInteractiveMode error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred');
      setDialogState('error');
      setClosing(false);
    }
  }, [codeWorkspaceId]);

  const handleCancel = useCallback(() => {
    setDialogState('closed');
    setGitStatus(null);
  }, []);

  const isOpen = dialogState !== 'closed';

  // Build dialog props based on state
  let dialogTitle = 'Close this session?';
  let dialogDescription = '';
  let confirmLabel = 'Close Session';
  let variant = 'default';

  if (dialogState === 'loading') {
    dialogTitle = 'Checking session...';
    dialogDescription = '';
  } else if (dialogState === 'warning') {
    dialogTitle = 'Warning';
    variant = 'destructive';
    dialogDescription = 'Your session contains unsaved changes. To keep them, commit and push your changes before closing. If you close now, those changes will be lost.';
  }

  return (
    <ChatNavProvider value={{ activeChatId: null, navigateToChat: (id) => { window.location.href = id ? `/chat/${id}` : '/'; } }}>
      <SidebarProvider>
        <AppSidebar user={session.user} />
        <SidebarInset>
          <div className="flex h-svh flex-col overflow-hidden">
            <div style={{ display: 'flex', alignItems: 'center', paddingRight: 20 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <ChatHeader workspaceId={codeWorkspaceId} />
              </div>
              <button
                onClick={handleOpenCloseDialog}
                title="Close Session"
                style={{ width: 22, height: 22, flexShrink: 0 }}
                className="flex items-center justify-center rounded border-2 border-destructive/40 hover:bg-destructive/10 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
                  <line x1="4" y1="4" x2="12" y2="12" />
                  <line x1="12" y1="4" x2="4" y2="12" />
                </svg>
              </button>
            </div>
            <TerminalView codeWorkspaceId={codeWorkspaceId} ensureContainer={ensureCodeWorkspaceContainer} onCloseSession={handleOpenCloseDialog} />
          </div>
          {dialogState === 'loading' && isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="fixed inset-0 bg-black/50" />
              <div className="relative z-50 w-full max-w-sm rounded-lg border border-border bg-background p-6 shadow-lg flex flex-col items-center gap-3">
                <svg className="animate-spin h-5 w-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm text-muted-foreground">Checking session...</span>
              </div>
            </div>
          )}
          {(dialogState === 'safe' || dialogState === 'warning') && (
            <ConfirmDialog
              open
              title={dialogState === 'warning' ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#ef4444' }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.57 3.22L1.51 15.01c-.63 1.09.16 2.49 1.43 2.49h14.12c1.27 0 2.06-1.4 1.43-2.49L11.43 3.22c-.63-1.09-2.23-1.09-2.86 0z" fill="#ef4444" />
                    <path d="M10 8v3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="10" cy="13.5" r="0.75" fill="white" />
                  </svg>
                  Warning
                </span>
              ) : dialogTitle}
              description={dialogDescription}
              confirmLabel={closing ? 'Closing...' : confirmLabel}
              variant={variant}
              onConfirm={handleConfirmClose}
              onCancel={handleCancel}
            />
          )}
          {dialogState === 'error' && (
            <ConfirmDialog
              open
              title="Failed to close session"
              description={errorMessage}
              confirmLabel="Retry"
              variant="destructive"
              onConfirm={handleConfirmClose}
              onCancel={handleCancel}
            />
          )}
        </SidebarInset>
      </SidebarProvider>
    </ChatNavProvider>
  );
}
