import React from 'react';
import { Node } from '@xyflow/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { NodeData } from '@/lib/types';

interface ActionNodePanelProps {
  node: Node;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
}

const COMMON_ACTIONS = {
  create: 'Create Record',
  update: 'Update Record',
  delete: 'Delete Record',
  search: 'Search/Find',
  send: 'Send Message',
  transform: 'Transform Data',
  filter: 'Filter Data',
  http: 'HTTP Request',
  custom: 'Custom Action',
};

export function ActionNodePanel({ node, setNodes }: ActionNodePanelProps) {
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
      {/* Basic Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Action Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={nodeData.label || ''}
              onChange={(e) => onUpdateNode({ label: e.target.value })}
              placeholder="Enter action label"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="appName">App/Service</Label>
            <Input
              id="appName"
              value={nodeData.appName || ''}
              onChange={(e) => onUpdateNode({ appName: e.target.value })}
              placeholder="e.g., Slack, Google Sheets, Airtable"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="action">Action Type</Label>
            <Select
              value={nodeData.action || 'create'}
              onValueChange={(value) => onUpdateNode({ action: value })}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(COMMON_ACTIONS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {nodeData.action === 'send' && (
            <div>
              <Label htmlFor="typeOf">Message Type</Label>
              <Select
                value={nodeData.typeOf || 'email'}
                onValueChange={(value) => onUpdateNode({ typeOf: value })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="slack">Slack Message</SelectItem>
                  <SelectItem value="teams">Teams Message</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action-specific Settings */}
      {(nodeData.action === 'create' || nodeData.action === 'update') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Record Settings
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Configure the data for this action</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Object/Table</Label>
              <Input
                placeholder="e.g., Customer, Order, Contact"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Field Mappings</Label>
              <Textarea
                placeholder="Map your data fields here..."
                className="mt-1.5 font-mono text-sm"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {nodeData.action === 'http' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">HTTP Request Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Method</Label>
              <Select defaultValue="GET">
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>URL</Label>
              <Input
                type="url"
                placeholder="https://api.example.com/endpoint"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Headers</Label>
              <Textarea
                placeholder="Content-Type: application/json"
                className="mt-1.5 font-mono text-sm"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {nodeData.action === 'transform' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data Transformation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Transform Type</Label>
              <Select defaultValue="map">
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="map">Map Fields</SelectItem>
                  <SelectItem value="filter">Filter Array</SelectItem>
                  <SelectItem value="aggregate">Aggregate Data</SelectItem>
                  <SelectItem value="format">Format Text</SelectItem>
                  <SelectItem value="parse">Parse JSON/CSV</SelectItem>
                  <SelectItem value="custom">Custom Script</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Node Info */}
      <div className="text-sm text-muted-foreground space-y-2">
        <p>
          <strong>Node ID:</strong> {node.id}
        </p>
        <p>
          <strong>Type:</strong> <Badge variant="outline">ACTION</Badge>
        </p>
        <p className="text-xs">
          Actions perform operations like creating records, sending messages, or transforming data.
        </p>
      </div>
    </div>
  );
} 