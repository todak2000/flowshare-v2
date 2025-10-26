'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LogOut } from 'lucide-react';

interface LogoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  loggingOut: boolean;
}

export function LogoutDialog({ open, onOpenChange, onConfirm, loggingOut }: LogoutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Logout</DialogTitle>
          <DialogDescription>
            Are you sure you want to logout? You will need to sign in again to access your account.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loggingOut}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loggingOut}>
            <LogOut className="mr-2 h-4 w-4" />
            {loggingOut ? 'Logging out...' : 'Logout'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}