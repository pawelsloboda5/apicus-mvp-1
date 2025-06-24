import React from 'react';
import { Node } from '@xyflow/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { NodeData } from '@/lib/types';

interface TriggerNodePanelProps {
  node: Node;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
}

export function TriggerNodePanel({ node, setNodes }: TriggerNodePanelProps) {
  const onUpdateNode = (updates: Partial<NodeData>) => {
    setNodes((prevNodes) =>
      prevNodes.map((n) =>
        n.id === node.id
          ? { ...n, data: { ...n.data, ...updates } }
          : n
      )
    );
  };
  const nodeData = node.data as NodeData;

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trigger Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={nodeData.label || ''}
              onChange={(e) => onUpdateNode({ label: e.target.value })}
              placeholder="Enter trigger label"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="triggerType">Trigger Type</Label>
            <Select
              value={nodeData.typeOf || 'webhook'}
              onValueChange={(value) => onUpdateNode({ typeOf: value })}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="webhook">Webhook</SelectItem>
                <SelectItem value="schedule">Schedule</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="form">Form Submission</SelectItem>
                <SelectItem value="file">File Upload</SelectItem>
                <SelectItem value="api">API Call</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* App Selection */}
          <div>
            <Label htmlFor="appName">App/Service</Label>
            <Input
              id="appName"
              value={nodeData.appName || ''}
              onChange={(e) => onUpdateNode({ appName: e.target.value })}
              placeholder="e.g., Stripe, Shopify, Google Sheets"
              className="mt-1.5"
            />
          </div>
        </CardContent>
      </Card>

      {/* Trigger-specific settings */}
      {nodeData.typeOf === 'webhook' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Webhook Settings
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Configure how this webhook receives data</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Webhook URL</Label>
              <div className="mt-1.5 p-2 bg-muted rounded-md font-mono text-sm">
                https://api.platform.com/webhooks/{node.id}
              </div>
            </div>
            <div>
              <Label>Authentication</Label>
              <Select defaultValue="none">
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="apikey">API Key</SelectItem>
                  <SelectItem value="oauth">OAuth</SelectItem>
                  <SelectItem value="basic">Basic Auth</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {nodeData.typeOf === 'schedule' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Schedule Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Frequency</Label>
              <Select defaultValue="daily">
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutely">Every Minute</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="custom">Custom Cron</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trigger Info */}
      <div className="text-sm text-muted-foreground space-y-2">
        <p>
          <strong>Node ID:</strong> {node.id}
        </p>
        <p>
          <strong>Type:</strong> <Badge variant="outline">TRIGGER</Badge>
        </p>
        <p className="text-xs">
          Triggers start your automation workflow when specific events occur.
        </p>
      </div>
    </div>
  );
} 