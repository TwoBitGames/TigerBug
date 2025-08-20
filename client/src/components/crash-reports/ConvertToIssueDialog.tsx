import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GitBranch, Bug, Package } from 'lucide-react';
import type { ConvertToIssueData } from '@/types';

interface ConvertToIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crashReportId?: number;
  crashError?: string;
  onConvert: (data: ConvertToIssueData) => void;
}

const priorityOptions = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' }
];

export const ConvertToIssueDialog = ({
  open,
  onOpenChange,
  crashReportId,
  crashError,
  onConvert
}: ConvertToIssueDialogProps) => {
  const [convertData, setConvertData] = useState<ConvertToIssueData>({
    priority: 'High',
    issue_type: 'Bug'
  });

  const handleConvert = () => {
    onConvert(convertData);
    setConvertData({
      priority: 'High',
      issue_type: 'Bug'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6 border-b">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
              <GitBranch className="h-5 w-5 text-primary" />
            </div>
            <span className="text-foreground font-semibold">Convert to Issue</span>
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground mt-3">
            Create a new issue from crash report #{crashReportId}. The crash data and stack trace will be automatically attached to help with debugging.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-6">
          <div className="space-y-3">
            <Label htmlFor="title" className="text-sm font-medium">Issue Title</Label>
            <Input
              id="title"
              value={convertData.title || ''}
              onChange={(e) => setConvertData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={`Crash Report #${crashReportId}: ${crashError || 'Application Crash'}`}
              className="text-base h-11"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use the default title based on the crash error message
            </p>
          </div>
          <div className="space-y-3">
            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
            <Textarea
              id="description"
              value={convertData.description || ''}
              onChange={(e) => setConvertData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Additional context, steps to reproduce, or notes about this crash..."
              className="min-h-[120px] text-base resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Crash data and stack trace will be automatically included
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="priority" className="text-sm font-medium">Priority</Label>
              <Select value={convertData.priority} onValueChange={(value) => setConvertData(prev => ({ ...prev, priority: value as any }))}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          option.value === 'Critical' ? 'bg-destructive' :
                          option.value === 'High' ? 'bg-orange-500' :
                          option.value === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}></div>
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label htmlFor="issue_type" className="text-sm font-medium">Type</Label>
              <Select value={convertData.issue_type} onValueChange={(value) => setConvertData(prev => ({ ...prev, issue_type: value as any }))}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bug">
                    <div className="flex items-center gap-2">
                      <Bug className="h-3 w-3 text-destructive/70" />
                      Bug
                    </div>
                  </SelectItem>
                  <SelectItem value="Feature">
                    <div className="flex items-center gap-2">
                      <Package className="h-3 w-3 text-primary/70" />
                      Feature
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter className="pt-6 border-t gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} size="lg" className="min-w-24">
            Cancel
          </Button>
          <Button onClick={handleConvert} className="bg-primary hover:bg-primary/90" size="lg">
            <GitBranch className="h-4 w-4 mr-2" />
            Convert to Issue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
