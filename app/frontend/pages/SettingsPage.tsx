import { useEffect, useState } from 'react';
import { Form, Select, Input, Button, Card, message, Divider, Alert } from 'antd';

export default function SettingsPage() {
  const [form] = Form.useForm();
  const [aiMode, setAiMode] = useState('cloud');

  useEffect(() => {
    window.electronAPI.getSettings().then((s) => {
      const settings = s as Record<string, string>;
      form.setFieldsValue({
        aiMode: settings.aiMode || 'cloud',
        apiKey: settings.apiKey || '',
        apiBase: settings.apiBase || '',
        modelName: settings.modelName || 'gpt-4o-mini',
        ollamaUrl: settings.ollamaUrl || 'http://localhost:11434',
        bilibiliSessdata: settings.bilibiliSessdata || '',
      });
      setAiMode(settings.aiMode || 'cloud');
    });
  }, [form]);

  const handleSave = async (values: Record<string, string>) => {
    await window.electronAPI.saveSettings(values);
    message.success('设置已保存');
  };

  return (
    <Card style={{ maxWidth: 600 }}>
      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Divider>平台配置</Divider>
        <Form.Item name="bilibiliSessdata" label="B站 SESSDATA" extra="从浏览器 Cookie 中获取，用于获取评论数据">
          <Input.Password placeholder="粘贴你的 B站 SESSDATA" />
        </Form.Item>

        <Divider>AI 配置</Divider>
        <Form.Item name="aiMode" label="AI 模式">
          <Select onChange={(v) => setAiMode(v)} options={[{ value: 'cloud', label: '云端 API' }, { value: 'local', label: '本地 Ollama' }]} />
        </Form.Item>
        {aiMode === 'cloud' ? (
          <>
            <Form.Item name="apiKey" label="API Key"><Input.Password placeholder="sk-..." /></Form.Item>
            <Form.Item name="apiBase" label="API Base URL"><Input placeholder="https://api.openai.com/v1" /></Form.Item>
            <Form.Item name="modelName" label="模型名称"><Input placeholder="gpt-4o-mini" /></Form.Item>
          </>
        ) : (
          <>
            <Form.Item name="ollamaUrl" label="Ollama URL"><Input placeholder="http://localhost:11434" /></Form.Item>
            <Form.Item name="modelName" label="模型名称"><Input placeholder="llama3" /></Form.Item>
          </>
        )}
        <Form.Item><Button type="primary" htmlType="submit">保存设置</Button></Form.Item>
      </Form>
    </Card>
  );
}
