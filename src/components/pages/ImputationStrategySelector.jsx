import React, { useState } from 'react';
import { AlertTriangle, Info, Settings, ChevronDown, ChevronRight, BarChart3, Brain, Zap, TreePine, Shuffle, Target } from 'lucide-react';

const ImputationStrategySelector = ({ 
  missingValueSummary = {
    total_missing: 1250,
    missing_percentage: 8.5,
    genes_with_missing: 89,
    samples_with_missing: 12,
    genes_missing_percentage: [5.2, 12.1, 3.8, 15.6, 8.9],
    samples_missing_percentage: [2.1, 4.5, 1.8, 6.3, 3.2]
  },
  onStrategySelect = async (strategy, parameters) => {},
  isProcessing = false 
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState('auto');
  const [expandedStrategy, setExpandedStrategy] = useState(null);
  const [parameters, setParameters] = useState({});

  const strategies = {
    auto: {
      name: 'Auto-Select',
      shortName: 'Auto',
      icon: <Brain className="w-5 h-5" />,
      description: 'Automatically selects the best method based on your data',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #4f46e5 100%)',
      category: 'smart',
      pros: ['Optimal selection', 'No tuning needed'],
      parameters: {}
    },
    mean: {
      name: 'Mean Imputation',
      shortName: 'Mean',
      icon: <BarChart3 className="w-5 h-5" />,
      description: 'Replace with mean expression of each gene',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
      category: 'simple',
      pros: ['Fast', 'Preserves levels'],
      parameters: {}
    },
    median: {
      name: 'Median Imputation',
      shortName: 'Median',
      icon: <BarChart3 className="w-5 h-5" />,
      description: 'Replace with median expression of each gene',
      gradient: 'linear-gradient(135deg, #14b8a6 0%, #10b981 100%)',
      category: 'simple',
      pros: ['Robust to outliers', 'Fast'],
      parameters: {}
    },
    knn: {
      name: 'K-Nearest Neighbors',
      shortName: 'KNN',
      icon: <Target className="w-5 h-5" />,
      description: 'Impute based on similar samples',
      gradient: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
      category: 'ml',
      pros: ['Sample similarity', 'Local structure'],
      parameters: {
        n_neighbors: { type: 'number', default: 5, min: 1, max: 20, label: 'Neighbors' }
      }
    },
    iterative: {
      name: 'Iterative (MICE)',
      shortName: 'MICE',
      icon: <Shuffle className="w-5 h-5" />,
      description: 'Advanced iterative modeling approach',
      gradient: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
      category: 'advanced',
      pros: ['Gene interactions', 'High accuracy'],
      parameters: {
        max_iter: { type: 'number', default: 10, min: 5, max: 50, label: 'Iterations' }
      }
    },
    matrix_factorization: {
      name: 'Matrix Factorization',
      shortName: 'SVD',
      icon: <Zap className="w-5 h-5" />,
      description: 'Low-rank matrix completion using SVD',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
      category: 'advanced',
      pros: ['High missing rates', 'Global patterns'],
      parameters: {
        n_components: { type: 'number', default: 50, min: 10, max: 200, label: 'Components' }
      }
    },
    correlation: {
      name: 'Correlation-based',
      shortName: 'Corr',
      icon: <TreePine className="w-5 h-5" />,
      description: 'Use gene correlations for imputation',
      gradient: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
      category: 'bio',
      pros: ['Gene relationships', 'Biologically meaningful'],
      parameters: {
        min_correlation: { type: 'number', default: 0.3, min: 0.1, max: 0.9, step: 0.1, label: 'Min Correlation' }
      }
    },
    random_forest: {
      name: 'Random Forest',
      shortName: 'RF',
      icon: <TreePine className="w-5 h-5" />,
      description: 'Machine learning prediction approach',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
      category: 'ml',
      pros: ['Non-linear patterns', 'Feature importance'],
      parameters: {
        n_estimators: { type: 'number', default: 100, min: 50, max: 500, label: 'Trees' }
      }
    },
    hybrid: {
      name: 'Hybrid Approach',
      shortName: 'Hybrid',
      icon: <Shuffle className="w-5 h-5" />,
      description: 'Combines multiple methods adaptively',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      category: 'smart',
      pros: ['Best of all methods', 'Adaptive'],
      parameters: {}
    }
  };

  const categories = {
    smart: { 
      name: 'Smart Selection', 
      color: '#8b5cf6'
    },
    simple: { 
      name: 'Simple & Fast', 
      color: '#3b82f6'
    },
    ml: { 
      name: 'Machine Learning', 
      color: '#f97316'
    },
    advanced: { 
      name: 'Advanced Methods', 
      color: '#ec4899'
    },
    bio: { 
      name: 'Biology-Aware', 
      color: '#10b981'
    }
  };

  const handleParameterChange = (param, value) => {
    setParameters(prev => ({
      ...prev,
      [param]: parseFloat(value) || value
    }));
  };

  const handleStrategySelect = async () => {
    const strategyParams = {};
    Object.keys(strategies[selectedStrategy].parameters).forEach(param => {
      if (parameters[param] !== undefined) {
        strategyParams[param] = parameters[param];
      } else {
        strategyParams[param] = strategies[selectedStrategy].parameters[param].default;
      }
    });
    
    await onStrategySelect(selectedStrategy, strategyParams);
  };

  const getMissingDataSeverity = (percentage) => {
    if (percentage < 5) return { 
      color: '#059669', 
      label: 'Low', 
      bgColor: '#d1fae5'
    };
    if (percentage < 15) return { 
      color: '#d97706', 
      label: 'Moderate', 
      bgColor: '#fef3c7'
    };
    return { 
      color: '#dc2626', 
      label: 'High', 
      bgColor: '#fee2e2'
    };
  };

  const severity = getMissingDataSeverity(missingValueSummary.missing_percentage);

  const containerStyle = {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  };

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e5e7eb',
    padding: '20px'
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px'
  };

  const titleStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  const badgeStyle = {
    padding: '8px 16px',
    borderRadius: '9999px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: severity.bgColor,
    color: severity.color
  };

  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '10px'
  };

  const statItemStyle = (bgColor, textColor) => ({
    textAlign: 'center',
    padding: '12px 8px',
    borderRadius: '8px',
    backgroundColor: bgColor,
    border: '1px solid rgba(0,0,0,0.08)'
  });

  const tabsStyle = {
    display: 'flex',
    gap: '2px',
    padding: '4px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    marginBottom: '16px'
  };

  const tabStyle = (isActive, color) => ({
    padding: '10px 16px',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '13px',
    color: isActive ? 'white' : '#64748b',
    background: isActive ? color : 'transparent',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    whiteSpace: 'nowrap',
    border: 'none',
    transform: isActive ? 'translateY(-1px)' : 'none',
    boxShadow: isActive ? `0 4px 12px ${color}40` : 'none'
  });

  const strategiesGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '12px'
  };

  const strategyCardStyle = (isSelected) => ({
    position: 'relative',
    borderRadius: '10px',
    border: isSelected ? '2px solid #8b5cf6' : '2px solid #e5e7eb',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: isSelected 
      ? '0 8px 25px rgba(139, 92, 246, 0.15), 0 0 0 4px rgba(139, 92, 246, 0.1)' 
      : '0 2px 8px rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
    transform: isSelected ? 'translateY(-2px)' : 'none'
  });

  const strategyHeaderStyle = (gradient) => ({
    background: gradient,
    padding: '14px',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  });

  const strategyContentStyle = {
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  };

  const prosListStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  };

  const proItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#059669'
  };

  const buttonStyle = {
    padding: '10px 24px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    background: isProcessing 
      ? '#9ca3af' 
      : 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
    color: 'white',
    border: 'none',
    cursor: isProcessing ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: isProcessing ? 'none' : '0 4px 12px rgba(124, 58, 237, 0.4)',
    transform: isProcessing ? 'none' : 'translateY(0)',
  };

  const footerStyle = {
    backgroundColor: '#f9fafb',
    padding: '12px 20px',
    borderBottomLeftRadius: '12px',
    borderBottomRightRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  };

  return (
    <div style={containerStyle}>
      {/* Header with Data Summary */}
      <div style={cardStyle}>
        <div style={headerStyle}>
          <div style={titleStyle}>
            <AlertTriangle size={24} color="#f97316" />
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
              Missing Values Analysis
            </h1>
          </div>
          <div style={badgeStyle}>
            {severity.label} Impact
          </div>
        </div>
        
        <div style={statsGridStyle}>
          <div style={statItemStyle('#fee2e2', '#dc2626')}>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626', margin: '0 0 4px 0' }}>
              {missingValueSummary.total_missing?.toLocaleString()}
            </p>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Missing Values</p>
          </div>
          <div style={statItemStyle(severity.bgColor, severity.color)}>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: severity.color, margin: '0 0 4px 0' }}>
              {missingValueSummary.missing_percentage?.toFixed(1)}%
            </p>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Missing Rate</p>
          </div>
          <div style={statItemStyle('#dbeafe', '#2563eb')}>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb', margin: '0 0 4px 0' }}>
              {missingValueSummary.genes_with_missing}
            </p>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Affected Genes</p>
          </div>
          <div style={statItemStyle('#ede9fe', '#7c3aed')}>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#7c3aed', margin: '0 0 4px 0' }}>
              {missingValueSummary.samples_with_missing}
            </p>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Affected Samples</p>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={cardStyle}>
        <div style={tabsStyle}>
          {Object.entries(categories).map(([catKey, category]) => {
            const strategiesInCategory = Object.entries(strategies).filter(([_, strategy]) => strategy.category === catKey);
            const isActive = strategiesInCategory.some(([key, _]) => key === selectedStrategy);
            
            return (
              <button
                key={catKey}
                style={tabStyle(isActive, category.color)}
                onClick={() => {
                  const firstInCategory = strategiesInCategory[0]?.[0];
                  if (firstInCategory) setSelectedStrategy(firstInCategory);
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.target.style.backgroundColor = '#e2e8f0';
                    e.target.style.color = '#475569';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#64748b';
                  }
                }}
              >
                {category.name} ({strategiesInCategory.length})
              </button>
            );
          })}
        </div>

        {/* Strategy Options */}
        <div style={{ padding: '20px' }}>
          {Object.entries(categories).map(([catKey, category]) => {
            const strategiesInCategory = Object.entries(strategies).filter(([_, strategy]) => strategy.category === catKey);
            const showCategory = strategiesInCategory.some(([key, _]) => key === selectedStrategy);
            
            if (!showCategory) return null;

            return (
              <div key={catKey} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                  {category.name}
                </h3>
                
                <div style={strategiesGridStyle}>
                  {strategiesInCategory.map(([key, strategy]) => (
                    <div
                      key={key}
                      style={strategyCardStyle(selectedStrategy === key)}
                      onClick={() => setSelectedStrategy(key)}
                    >
                      <div style={strategyHeaderStyle(strategy.gradient)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {strategy.icon}
                          <h4 style={{ fontWeight: '600', margin: 0 }}>{strategy.shortName}</h4>
                        </div>
                        {selectedStrategy === key && (
                          <div style={{ 
                            width: '24px', 
                            height: '24px', 
                            backgroundColor: 'white', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                          }}>
                            <div style={{ 
                              width: '12px', 
                              height: '12px', 
                              backgroundColor: '#8b5cf6', 
                              borderRadius: '50%' 
                            }} />
                          </div>
                        )}
                      </div>
                      
                      <div style={strategyContentStyle}>
                        <p style={{ fontSize: '14px', color: '#374151', margin: 0 }}>{strategy.description}</p>
                        <div style={prosListStyle}>
                          {strategy.pros.map((pro, idx) => (
                            <div key={idx} style={proItemStyle}>
                              <div style={{ 
                                width: '6px', 
                                height: '6px', 
                                backgroundColor: '#10b981', 
                                borderRadius: '50%',
                                flexShrink: 0
                              }} />
                              <span>{pro}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Parameters & Action */}
        {Object.keys(strategies[selectedStrategy].parameters).length > 0 && (
          <div style={{ borderTop: '1px solid #e5e7eb', padding: '20px' }}>
            <h4 style={{ fontWeight: '600', color: '#111827', marginBottom: '12px' }}>Configure Parameters</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {Object.entries(strategies[selectedStrategy].parameters).map(([param, config]) => (
                <div key={param}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    {config.label}
                  </label>
                  <input
                    type={config.type}
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    defaultValue={config.default}
                    onChange={(e) => handleParameterChange(param, e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '8px 12px', 
                      border: '1px solid #d1d5db', 
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={footerStyle}>
          <div>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
              Selected: <span style={{ fontWeight: '600', color: '#111827' }}>{strategies[selectedStrategy].name}</span>
            </p>
          </div>
          <button
            onClick={handleStrategySelect}
            disabled={isProcessing}
            style={buttonStyle}
          >
            {isProcessing ? (
              <>
                <div style={{ 
                  width: '16px', 
                  height: '16px', 
                  border: '2px solid white', 
                  borderTop: '2px solid transparent', 
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <span>Processing...</span>
              </>
            ) : (
              'Process Data'
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ImputationStrategySelector;