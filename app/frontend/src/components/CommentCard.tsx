import { Card, Tag, Button, Typography, Space } from 'antd';
import { ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

interface CommentCardProps {
  id: string;
  author?: string;
  content: string;
  category?: string;
  isViolation: boolean;
  confidence: number;
  aiReason?: string;
  onToggleViolation?: (id: string, isViolation: boolean) => void;
}

const VIOLATION_COLORS: Record<string, string> = {
  '涉政': 'red',
  '涉黄': 'magenta',
  '暴力': 'volcano',
  '诈骗': 'orange',
  '仇恨言论': 'gold',
  '骚扰': 'lime',
};

export default function CommentCard({ id, author, content, category, isViolation, confidence, aiReason, onToggleViolation }: CommentCardProps) {
  return (
    <Card
      size="small"
      style={{ marginBottom: 8, borderLeft: isViolation ? '3px solid #ff4d4f' : '3px solid #52c41a' }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>{author || '匿名用户'}</Text>
          <Space>
            {category && <Tag color={VIOLATION_COLORS[category] || 'default'}>{category}</Tag>}
            <Tag color={isViolation ? 'error' : 'success'} icon={isViolation ? <ExclamationCircleOutlined /> : <CheckCircleOutlined />}>
              {isViolation ? '违规' : '合规'}
            </Tag>
            <Text type="secondary">置信度: {(confidence * 100).toFixed(0)}%</Text>
          </Space>
        </div>
        <Paragraph>{content}</Paragraph>
        {aiReason && <Text type="secondary" style={{ fontSize: 12 }}>AI 判定: {aiReason}</Text>}
        {onToggleViolation && (
          <Button size="small" type="link" onClick={() => onToggleViolation(id, !isViolation)}>
            {isViolation ? '标记为合规' : '标记为违规'}
          </Button>
        )}
      </Space>
    </Card>
  );
}
