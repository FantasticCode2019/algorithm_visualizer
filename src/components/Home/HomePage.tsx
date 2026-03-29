import { useNavigate } from 'react-router-dom';
import { getAlgorithmsByCategory } from '../../constants/algorithms';
import { ALGORITHMS } from '../../constants/algorithms';

export default function HomePage() {
  const navigate = useNavigate();
  const sortAlgorithms = getAlgorithmsByCategory('sort');
  const searchAlgorithms = getAlgorithmsByCategory('search');
  const treeAlgorithms = getAlgorithmsByCategory('tree');
  const networkAlgorithms = getAlgorithmsByCategory('network');
  const graphAlgorithms = getAlgorithmsByCategory('graph');

  const handleCardClick = (id: string) => {
    navigate(`/algorithm/${id}`);
  };

  return (
    <div className="min-h-screen bg-surface-dark text-white p-8">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
            数据结构演练场
          </h1>
          <p className="text-slate-400 text-lg">
            动态可视化算法执行过程，边操作边理解
          </p>
        </header>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">S</span>
            排序算法
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {sortAlgorithms.map(algo => (
              <button
                key={algo.id}
                onClick={() => handleCardClick(algo.id)}
                className="bg-surface-card border border-surface-border rounded-xl p-4 hover:border-primary transition-colors text-left group"
              >
                <h3 className="font-medium mb-2 group-hover:text-primary">{algo.name}</h3>
                <p className="text-xs text-slate-400">{algo.complexity?.average ?? ''}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{algo.description.slice(0, 40)}...</p>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">🔍</span>
            查找算法
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {searchAlgorithms.map(algo => (
              <button
                key={algo.id}
                onClick={() => handleCardClick(algo.id)}
                className="bg-surface-card border border-surface-border rounded-xl p-4 hover:border-green-500 transition-colors text-left group"
              >
                <h3 className="font-medium mb-2 group-hover:text-green-400">{algo.name}</h3>
                <p className="text-xs text-slate-400">{algo.complexity?.average ?? ''}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{algo.description.slice(0, 40)}...</p>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">🌲</span>
            树结构算法
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {treeAlgorithms.map(algo => (
              <button
                key={algo.id}
                onClick={() => handleCardClick(algo.id)}
                className="bg-surface-card border border-surface-border rounded-xl p-4 hover:border-purple-500 transition-colors text-left group"
              >
                <h3 className="font-medium mb-2 group-hover:text-purple-400">{algo.name}</h3>
                <p className="text-xs text-slate-400">{algo.complexity?.average ?? ''}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{algo.description.slice(0, 40)}...</p>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">📊</span>
            图算法
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {graphAlgorithms.map(algo => (
              <button
                key={algo.id}
                onClick={() => handleCardClick(algo.id)}
                className="bg-surface-card border border-surface-border rounded-xl p-4 hover:border-amber-500 transition-colors text-left group"
              >
                <h3 className="font-medium mb-2 group-hover:text-amber-400">{algo.name}</h3>
                <p className="text-xs text-slate-400">{algo.complexity?.average ?? ''}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{algo.description.slice(0, 40)}...</p>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">🌐</span>
            网络协议
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {networkAlgorithms.map(algo => (
              <button
                key={algo.id}
                onClick={() => handleCardClick(algo.id)}
                className="bg-surface-card border border-surface-border rounded-xl p-4 hover:border-cyan-500 transition-colors text-left group"
              >
                <h3 className="font-medium mb-2 group-hover:text-cyan-400">{algo.name}</h3>
                <p className="text-xs text-slate-400">{algo.complexity?.average ?? ''}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{algo.description.slice(0, 40)}...</p>
              </button>
            ))}
          </div>
        </section>

        <footer className="text-center text-slate-500 text-sm mt-12">
          共 {ALGORITHMS.length} 个算法 · 桌面端体验更佳
        </footer>
      </div>
    </div>
  );
}