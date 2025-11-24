import { useEffect, useState } from 'react';
import { ArrowRight, Clock, Shield, Zap, Settings, FileText, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Material, CarouselImage, CustomerReview } from '../types/database';
import { Carousel } from '../components/Carousel';
import { MaterialCard } from '../components/MaterialCard';
import { ReviewsSection } from '../components/ReviewsSection';

interface HomePageProps {
  onNavigate: (page: string) => void;
  onSelectMaterial?: (material: Material) => void;
}

export function HomePage({ onNavigate, onSelectMaterial }: HomePageProps) {
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);

  useEffect(() => {
    loadCarouselImages();
    loadMaterials();
    loadReviews();
  }, []);

  const loadCarouselImages = async () => {
    const { data } = await supabase
      .from('carousel_images')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    if (data) {
      setCarouselImages(data);
    }
  };

  const loadMaterials = async () => {
    const { data } = await supabase
      .from('materials')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    if (data) {
      setMaterials(data);
    }
  };

  const loadReviews = async () => {
    const { data } = await supabase
      .from('customer_reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) {
      setReviews(data);
    }
  };

  const handleMaterialSelect = (material: Material) => {
    if (onSelectMaterial) {
      onSelectMaterial(material);
    }
    onNavigate('quote');
  };

  return (
    <div className="min-h-screen bg-white">
      {carouselImages.length > 0 && <Carousel images={carouselImages} />}

      <section className="relative bg-gradient-to-b from-gray-50 to-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              木箱を、もっと簡単に。
              <br />
              もっと早く。
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              サイズを入力するだけで、すぐ価格が出て、そのまま注文。
              <br />
              見積り待ちのストレスから解放される、新しい木箱調達体験。
            </p>
            <button
              onClick={() => onNavigate('quote')}
              className="inline-flex items-center px-8 py-4 text-lg font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-all transform hover:scale-105"
            >
              今すぐ見積もり作成
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              これまでの課題を解決
            </h2>
            <p className="text-lg text-gray-600">
              従来の木箱発注プロセスには、多くの時間とストレスがありました
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-xl">
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-gray-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">見積もりに時間がかかる</h3>
              <p className="text-gray-600 leading-relaxed">
                サイズを測って送信、質問が返ってきて、また返信して…
                見積もりが出るまで数日かかることも。
              </p>
            </div>

            <div className="bg-gray-50 p-8 rounded-xl">
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-gray-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">伝達ミスが起きやすい</h3>
              <p className="text-gray-600 leading-relaxed">
                外寸と内寸の混同、板厚の認識違い、
                オプション仕様の誤解など、トラブルの原因に。
              </p>
            </div>

            <div className="bg-gray-50 p-8 rounded-xl">
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                <Package className="w-6 h-6 text-gray-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">納期が読みにくい</h3>
              <p className="text-gray-600 leading-relaxed">
                見積もりから発注までの時間、製作期間の不透明さ、
                急ぎの案件への対応が難しい。
              </p>
            </div>
          </div>
        </div>
      </section> */}

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              板材を選ぶ
            </h2>
            <p className="text-lg text-gray-600">
              用途に合わせて最適な板材を選択できます
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {materials.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                onSelect={handleMaterialSelect}
              />
            ))}
          </div>
        </div>
      </section>

      <ReviewsSection reviews={reviews} />

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              BOXPACKの特徴
            </h2>
            <p className="text-lg text-gray-600">
              シンプルでストレスのない木箱調達体験を提供します
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-amber-600 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">即座に見積もり</h3>
              <p className="text-gray-600 leading-relaxed">
                内寸サイズを入力するだけで、リアルタイムに価格が表示されます。
                待ち時間はゼロ。
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-amber-600 rounded-lg flex items-center justify-center mb-4">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">自由なカスタマイズ</h3>
              <p className="text-gray-600 leading-relaxed">
                7種類の板材、取っ手・バックル・補強材などのオプションを自由に選択。
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-amber-600 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">PDF見積書</h3>
              <p className="text-gray-600 leading-relaxed">
                社内稟議や現場共有に使える、プロフェッショナルな見積書をワンクリックでダウンロード。
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-amber-600 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">透明な価格設定</h3>
              <p className="text-gray-600 leading-relaxed">
                材料費、加工費、オプション費用がすべて明確。
                後から追加料金が発生することはありません。
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-amber-600 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">即納オプション</h3>
              <p className="text-gray-600 leading-relaxed">
                急ぎの案件にも対応。即納オプションを選択すれば、優先生産で納期を短縮できます。
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-amber-600 rounded-lg flex items-center justify-center mb-4">
                <Package className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">簡単な再注文</h3>
              <p className="text-gray-600 leading-relaxed">
                過去の注文履歴から同じ仕様をワンクリックで再注文。
                よく使うサイズはテンプレート保存も可能。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              ご利用の流れ
            </h2>
            <p className="text-lg text-gray-600">
              たった数ステップで、木箱の注文が完了します
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">板材選択</h3>
              <p className="text-gray-600">
                ホームページから板材を選択します
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-amber-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">サイズと厚み</h3>
              <p className="text-gray-600">
                内寸サイズと板厚を入力
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-amber-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">見積もり確認</h3>
              <p className="text-gray-600">
                即座に表示される価格を確認し、カートへ
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-amber-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">注文完了</h3>
              <p className="text-gray-600">
                配送先と決済情報を入力して注文確定
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-amber-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            今すぐ始めましょう
          </h2>
          <p className="text-xl text-gray-100 mb-8 leading-relaxed">
            木箱調達の時間を大幅に短縮。
            <br />
            ストレスフリーな体験を、今すぐお試しください。
          </p>
          <button
            onClick={() => onNavigate('quote')}
            className="inline-flex items-center px-8 py-4 text-lg font-medium text-gray-900 bg-white rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105"
          >
            無料で見積もり作成
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  );
}
