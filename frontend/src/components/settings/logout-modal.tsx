import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface LogoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogout: () => void;
  loggingOut: boolean;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  open,
  onOpenChange,
  onLogout,
  loggingOut,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogDescription>
          Are you sure you want to logout?
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={loggingOut}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={onLogout}
          disabled={loggingOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {loggingOut ? "Logging out..." : "Logout"}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);