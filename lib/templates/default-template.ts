import { Node, Edge } from '@xyflow/react';
import { PlatformType } from '@/lib/types';

/**
 * Default template for new users
 * Shows a simple marketing automation workflow
 */

export const DEFAULT_TEMPLATE_NODES: Node[] = [
  {
    id: 'trigger-1',
    type: 'trigger',
    position: { x: 100, y: 200 },
    data: {
      label: 'New Form Submission',
      appName: 'Typeform',
      action: 'new_submission',
      typeOf: 'webhook',
      minuteContribution: 0.5,
    },
  },
  {
    id: 'action-1',
    type: 'action',
    position: { x: 350, y: 200 },
    data: {
      label: 'Add to CRM',
      appName: 'HubSpot',
      action: 'create_contact',
      typeOf: 'write',
      minuteContribution: 2,
    },
  },
  {
    id: 'decision-1',
    type: 'decision',
    position: { x: 600, y: 200 },
    data: {
      label: 'Check Lead Score',
      appName: 'Filter',
      action: 'condition',
      typeOf: 'filter',
      conditionType: 'greater_than',
      fieldPath: 'lead_score',
      operator: '>',
      compareValue: '50',
      minuteContribution: 1,
    },
  },
  {
    id: 'action-2',
    type: 'action',
    position: { x: 850, y: 100 },
    data: {
      label: 'Send Welcome Email',
      appName: 'Gmail',
      action: 'send_email',
      typeOf: 'write',
      minuteContribution: 3,
    },
  },
  {
    id: 'action-3',
    type: 'action',
    position: { x: 850, y: 300 },
    data: {
      label: 'Add to Nurture List',
      appName: 'Mailchimp',
      action: 'add_subscriber',
      typeOf: 'write',
      minuteContribution: 2,
    },
  },
];

export const DEFAULT_TEMPLATE_EDGES: Edge[] = [
  {
    id: 'e-trigger-action1',
    source: 'trigger-1',
    target: 'action-1',
    type: 'custom',
  },
  {
    id: 'e-action1-decision',
    source: 'action-1',
    target: 'decision-1',
    type: 'custom',
  },
  {
    id: 'e-decision-action2',
    source: 'decision-1',
    target: 'action-2',
    type: 'custom',
    label: 'Yes (>50)',
    data: { condition: true },
  },
  {
    id: 'e-decision-action3',
    source: 'decision-1',
    target: 'action-3',
    type: 'custom',
    label: 'No (≤50)',
    data: { condition: false },
  },
];

export const DEFAULT_TEMPLATE = {
  name: 'Lead Qualification Workflow',
  description: 'Automatically qualify and route new leads based on their score',
  platform: 'zapier' as PlatformType,
  nodes: DEFAULT_TEMPLATE_NODES,
  edges: DEFAULT_TEMPLATE_EDGES,
  runsPerMonth: 500,
  minutesPerRun: 8.5,
  hourlyRate: 35,
  taskMultiplier: 1.8,
  taskType: 'sales',
}; 