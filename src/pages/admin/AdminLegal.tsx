import { useState, useEffect } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface TermsData {
  id: string;
  content: string;
  version: number;
  effective_date: string;
  updated_at: string;
}

export function AdminLegal() {
  const [terms, setTerms] = useState<TermsData | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadTerms();
  }, []);

  const loadTerms = async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('terms_of_service')
      .select('*')
      .eq('id', 'current')
      .single();

    if (fetchError) {
      setError(fetchError.message);
    } else if (data) {
      setTerms(data);
      setContent(data.content);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!content.trim()) {
      setError('利用規約の内容を入力してください');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    const newVersion = terms ? terms.version + 1 : 1;

    const { error: updateError } = await supabase
      .from('terms_of_service')
      .upsert({
        id: 'current',
        content: content,
        version: newVersion,
        effective_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      await loadTerms();
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">利用規約管理</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          {saving ? '保存中...' : '保存'}
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
          利用規約を保存しました
        </div>
      )}

      {terms && (
        <div className="mb-4 bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            現在のバージョン: {terms.version} | 
            有効日: {terms.effective_date ? new Date(terms.effective_date).toLocaleDateString('ja-JP') : '-'} |
            最終更新: {new Date(terms.updated_at).toLocaleDateString('ja-JP')}
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            利用規約の内容 <span className="text-red-600">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">
            HTML形式で記述できます。セクションは &lt;section&gt; タグで囲み、見出しは &lt;h2&gt; タグを使用してください。
          </p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono text-sm"
            placeholder="利用規約の内容をHTML形式で入力してください..."
          />
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">プレビュー</h3>
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>
    </div>
  );
}

