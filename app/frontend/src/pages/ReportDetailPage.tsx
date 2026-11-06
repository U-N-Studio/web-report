import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Button, Statistic, Row, Col, Card } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import CommentCard from '../components/CommentCard';
import api from '../services/api';
import type { ReportDetail } from '@shared/types';

const { Title } = Typography;

export default function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportDetail | null>(null);

  useEffect(() => {
    if (id) api.getReportDetail(id).then((r) => setReport(r));
  }, [id]);

  if (!report) return <div>加载中...</div>;

  const handleToggle = async (commentId: string, isViolation: boolean) => {
    await api.updateCommentStatus(commentId, isViolation);
    if (id) api.getReportDetail(id).then((r) => setReport(r));
  };

  const violations = report.comments.filter((c) => c.isViolation);

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/reports')} style={{ marginBottom: 16 }}>
        返回列表
      </Button>
      <Title level={4}>{report.title || report.url}</Title>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}><Card><Statistic title="总评论" value={report.totalComments} /></Card></Col>
        <Col span={8}><Card><Statistic title="违规评论" value={report.flaggedComments} valueStyle={{ color: '#cf1322' }} /></Card></Col>
        <Col span={8}><Card><Statistic title="合规率" value={report.totalComments ? ((report.totalComments - report.flaggedComments) / report.totalComments * 100).toFixed(1) : 0} suffix="%" /></Card></Col>
      </Row>
      <Title level={5}>违规评论 ({violations.length})</Title>
      {violations.map((c) => (
        <CommentCard key={c.id} id={c.id} author={c.author} content={c.content} category={c.category} isViolation={c.isViolation} confidence={c.confidence} aiReason={c.aiReason} onToggleViolation={handleToggle} />
      ))}
      <Title level={5} style={{ marginTop: 16 }}>全部评论 ({report.comments.length})</Title>
      {report.comments.map((c) => (
        <CommentCard key={c.id} id={c.id} author={c.author} content={c.content} category={c.category} isViolation={c.isViolation} confidence={c.confidence} aiReason={c.aiReason} onToggleViolation={handleToggle} />
      ))}
    </div>
  );
}
