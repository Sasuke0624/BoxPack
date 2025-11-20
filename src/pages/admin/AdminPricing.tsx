import { useState, useEffect } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PricingSettings {
  express_rate_per_mm: number;
  bulk_discount_threshold: number;
  bulk_discount_percent: number;
}

export function AdminPricing() {
  const [settings, setSettings] = useState<PricingSettings>({
    express_rate_per_mm: 3,
    bulk_discount_threshold: 10,
    bulk_discount_percent: 5,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    
    // Check if settings table exists, if not create it
    const { data, error: fetchError } = await supabase
      .from('pricing_settings')
      .select('*')
      .single();

    if (fetchError) {
      // Table might not exist, use defaults
      console.log('Settings table not found, using defaults');
    } else if (data) {
      setSettings({
        express_rate_per_mm: data.express_rate_per_mm || 3,
        bulk_discount_threshold: data.bulk_discount_threshold || 10,
        bulk_discount_percent: data.bulk_discount_percent || 5,
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    // Validate
    if (settings.express_rate_per_mm < 0) {
      setError('即時配送料金は0以上である必要があります');
      setSaving(false);
      return;
    }
    if (settings.bulk_discount_threshold < 1) {
      setError('大量購入の閾値は1以上である必要があります');
      setSaving(false);
      return;
    }
    if (settings.bulk_discount_percent < 0 || settings.bulk_discount_percent > 100) {
      setError('割引率は0-100の間である必要があります');
      setSaving(false);
      return;
    }

    // Upsert settings
    const { error } = await supabase
      .from('pricing_settings')
      .upsert({
        id: 'default',
        express_rate_per_mm: settings.express_rate_per_mm,
        bulk_discount_threshold: settings.bulk_discount_threshold,
        bulk_discount_percent: settings.bulk_discount_percent,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
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
        <h2 className="text-3xl font-bold text-gray-900">価格設定</h2>
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
          設定を保存しました
        </div>
      )}

      <div className="space-y-6">
        {/* Express Delivery Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">即時配送料金設定</h3>
          <p className="text-sm text-gray-600 mb-4">
            即時配送オプションが選択された場合の、mm単位の料金を設定します。
            現在の計算式: (幅 + 奥行 + 高さ) × 設定料金 = 即時配送料金
          </p>
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              即時配送料金 (円/mm) <span className="text-red-600">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.express_rate_per_mm}
                onChange={(e) => setSettings({
                  ...settings,
                  express_rate_per_mm: parseFloat(e.target.value) || 0
                })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <span className="text-gray-600">円/mm</span>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              例: 500mm + 400mm + 300mm = 1200mm × 3円 = 3,600円
            </p>
          </div>
        </div>

        {/* Bulk Purchase Discount Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">大量購入割引設定</h3>
          <p className="text-sm text-gray-600 mb-4">
            指定数量以上を購入した場合に適用される割引率を設定します。
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                割引適用数量 (個) <span className="text-red-600">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={settings.bulk_discount_threshold}
                  onChange={(e) => setSettings({
                    ...settings,
                    bulk_discount_threshold: parseInt(e.target.value) || 1
                  })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <span className="text-gray-600">個以上</span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                この数量以上購入すると割引が適用されます
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                割引率 (%) <span className="text-red-600">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={settings.bulk_discount_percent}
                  onChange={(e) => setSettings({
                    ...settings,
                    bulk_discount_percent: parseFloat(e.target.value) || 0
                  })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <span className="text-gray-600">%</span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                例: 10個以上購入で5%割引
              </p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>計算例:</strong> 合計金額が¥100,000で、{settings.bulk_discount_threshold}個以上購入の場合、
              ¥{settings.bulk_discount_percent > 0 
                ? (100000 * (1 - settings.bulk_discount_percent / 100)).toLocaleString()
                : '100,000'
              } (割引額: ¥{(100000 * settings.bulk_discount_percent / 100).toLocaleString()})
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

