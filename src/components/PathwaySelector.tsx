import React, { useState, useMemo } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, Database, Users, ArrowRight } from 'lucide-react';

const PathwaySelector = ({ pathwayResults, onPathwaySelect, onClose, searchQuery = "pathways" }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLibrary, setSelectedLibrary] = useState('all');
  const [sortBy, setSortBy] = useState('gene_count');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Get unique libraries for filtering
  const libraries = useMemo(() => {
    const libs = pathwayResults.map(p => p.library);
    const uniqueLibs = libs.filter((lib, index) => libs.indexOf(lib) === index);
    return uniqueLibs.sort();
  }, [pathwayResults]);

  // Filter and sort pathways
  const filteredAndSortedPathways = useMemo(() => {
    let filtered = pathwayResults.filter(pathway => {
      const matchesSearch = pathway.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           pathway.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLibrary = selectedLibrary === 'all' || pathway.library === selectedLibrary;
      return matchesSearch && matchesLibrary;
    });

    // Sort pathways
    filtered.sort((a, b) => {
      let aVal, bVal;
      if (sortBy === 'gene_count') {
        aVal = a.gene_count;
        bVal = b.gene_count;
      } else if (sortBy === 'name') {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
      } else if (sortBy === 'library') {
        aVal = a.library.toLowerCase();
        bVal = b.library.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [pathwayResults, searchTerm, selectedLibrary, sortBy, sortOrder]);

  const handlePathwayClick = (pathway) => {
    onPathwaySelect(pathway);
  };

  const getLibraryColor = (library) => {
    // Generate a hash from the library name for consistent coloring
    const hash = library.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    // Predefined color palette for better visual consistency
    const colorPalette = [
      { bg: '#dbeafe', text: '#1e40af' }, // blue
      { bg: '#dcfce7', text: '#166534' }, // green
      { bg: '#f3e8ff', text: '#7c2d12' }, // purple
      { bg: '#fed7aa', text: '#c2410c' }, // orange
      { bg: '#fecaca', text: '#dc2626' }, // red
      { bg: '#e0e7ff', text: '#4338ca' }, // indigo
      { bg: '#fce7f3', text: '#be185d' }, // pink
      { bg: '#ccfbf1', text: '#0f766e' }, // teal
      { bg: '#cffafe', text: '#0891b2' }, // cyan
      { bg: '#fef3c7', text: '#d97706' }, // amber
      { bg: '#ecfccb', text: '#65a30d' }, // lime
      { bg: '#d1fae5', text: '#059669' }, // emerald
      { bg: '#ede9fe', text: '#7c3aed' }, // violet
      { bg: '#fdf2f8', text: '#c026d3' }, // fuchsia
      { bg: '#ffe4e6', text: '#e11d48' }  // rose
    ];
    
    // Use hash to select a color from the palette
    const colorIndex = Math.abs(hash) % colorPalette.length;
    return colorPalette[colorIndex];
  };

  const formatPathwayName = (name) => {
    // Remove library prefixes and IDs for cleaner display
    return name.replace(/^[^_]+_\d+_/, '').replace(/\s+R-HSA-\d+$/, '').replace(/\s+WP\d+$/, '');
  };

  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '16px'
  };

  const modalContentStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    maxWidth: '800px',
    width: '100%',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column'
  };

  const headerStyle = {
    padding: '16px',
    borderBottom: '1px solid #e5e7eb'
  };

  const titleRowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px'
  };

  const titleStyle = {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#111827',
    margin: 0
  };

  const closeButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    fontSize: '24px',
    fontWeight: 'bold',
    cursor: 'pointer',
    padding: '4px'
  };

  const subtitleStyle = {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '12px'
  };

  const searchContainerStyle: React.CSSProperties = {
    position: 'relative',
    marginBottom: '8px'
  };

  const searchInputStyle = {
    width: '100%',
    paddingLeft: '36px',
    paddingRight: '12px',
    paddingTop: '6px',
    paddingBottom: '6px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '13px',
    outline: 'none'
  };

  const searchIconStyle: React.CSSProperties = {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
    width: '16px',
    height: '16px'
  };

  const filterRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  const filterButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '3px 8px',
    fontSize: '13px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    background: 'white',
    cursor: 'pointer'
  };

  const filterContentStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    padding: '10px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    marginTop: '8px'
  };

  const selectStyle = {
    padding: '3px 8px',
    border: '1px solid #d1d5db',
    borderRadius: '3px',
    fontSize: '13px'
  };

  const pathwayListStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '12px'
  };

  const pathwayItemStyle = {
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: 'white'
  };

  const pathwayItemHoverStyle = {
    ...pathwayItemStyle,
    borderColor: '#93c5fd',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  };

  const pathwayHeaderStyle = {
    display: 'flex',
    alignItems: 'start',
    justifyContent: 'space-between'
  };

  const pathwayInfoStyle = {
    flex: 1,
    minWidth: 0
  };

  const pathwayTitleRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px'
  };

  const pathwayTitleStyle = {
    fontWeight: '600',
    color: '#111827',
    fontSize: '14px'
  };

  const libraryBadgeStyle = (library) => {
    const colors = getLibraryColor(library);
    return {
      padding: '2px 6px',
      borderRadius: '10px',
      fontSize: '11px',
      fontWeight: '500',
      backgroundColor: colors.bg,
      color: colors.text,
      whiteSpace: 'nowrap'
    };
  };

  const descriptionStyle = {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '8px',
    lineHeight: '1.4'
  };

  const statsRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '12px',
    color: '#6b7280'
  };

  const statStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  };

  const arrowStyle = {
    display: 'flex',
    alignItems: 'center',
    color: '#3b82f6',
    opacity: 0,
    transition: 'opacity 0.2s'
  };

  const footerStyle = {
    padding: '12px 16px',
    borderTop: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb'
  };

  const footerContentStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  };

  const cancelButtonStyle = {
    padding: '6px 12px',
    color: '#6b7280',
    fontWeight: '500',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px'
  };

  const emptyStateStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '24px'
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={titleRowStyle}>
            <h2 style={titleStyle}>
              Select Pathway
            </h2>
            <button
              onClick={onClose}
              style={closeButtonStyle}
            >
              ×
            </button>
          </div>
          
          <div style={subtitleStyle}>
            Found {pathwayResults.length} pathways matching "{searchQuery}". Select one to filter your heatmap.
          </div>

          {/* Search and Filters */}
          <div>
            <div style={searchContainerStyle}>
              <Search style={searchIconStyle} />
              <input
                type="text"
                placeholder="Search pathways..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={searchInputStyle}
              />
            </div>

            <div style={filterRowStyle}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={filterButtonStyle}
              >
                <Filter style={{ width: '14px', height: '14px' }} />
                Filters
                {showFilters ? <ChevronUp style={{ width: '14px', height: '14px' }} /> : <ChevronDown style={{ width: '14px', height: '14px' }} />}
              </button>

              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Showing {filteredAndSortedPathways.length} of {pathwayResults.length} pathways
              </div>
            </div>

            {showFilters && (
              <div style={filterContentStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151' }}>Library:</label>
                  <select
                    value={selectedLibrary}
                    onChange={(e) => setSelectedLibrary(e.target.value)}
                    style={selectStyle}
                  >
                    <option value="all">All Libraries</option>
                    {libraries.map(lib => (
                      <option key={lib} value={lib}>{lib}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151' }}>Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={selectStyle}
                  >
                    <option value="gene_count">Gene Count</option>
                    <option value="name">Name</option>
                    <option value="library">Library</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    style={{ padding: '2px', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {sortOrder === 'asc' ? <ChevronUp style={{ width: '14px', height: '14px' }} /> : <ChevronDown style={{ width: '14px', height: '14px' }} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pathway List */}
        <div style={pathwayListStyle}>
          <div>
            {filteredAndSortedPathways.map((pathway, index) => (
              <div
                key={index}
                onClick={() => handlePathwayClick(pathway)}
                style={pathwayItemStyle}
                onMouseEnter={(e) => {
                  const target = e.currentTarget as HTMLDivElement;
                  target.style.borderColor = '#3b82f6';
                  target.style.backgroundColor = '#f8fafc';
                  target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.15)';
                  const arrowIcon = target.querySelector('.arrow-icon') as HTMLElement;
                  if (arrowIcon) arrowIcon.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  const target = e.currentTarget as HTMLDivElement;
                  target.style.borderColor = '#e5e7eb';
                  target.style.backgroundColor = 'white';
                  target.style.boxShadow = 'none';
                  const arrowIcon = target.querySelector('.arrow-icon') as HTMLElement;
                  if (arrowIcon) arrowIcon.style.opacity = '0';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <h3 style={{ fontWeight: '600', color: '#111827', fontSize: '14px', margin: 0 }}>
                        {formatPathwayName(pathway.name)}
                      </h3>
                      <span style={libraryBadgeStyle(pathway.library)}>
                        {pathway.library.replace(/_\d+$/, '')}
                      </span>
                    </div>
                    
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', lineHeight: '1.4', margin: '0 0 8px 0' }}>
                      {pathway.description}
                    </p>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#6b7280' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Users style={{ width: '14px', height: '14px' }} />
                        <span>{pathway.gene_count.toLocaleString()} genes</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Database style={{ width: '14px', height: '14px' }} />
                        <span>{pathway.library}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="arrow-icon" style={{ display: 'flex', alignItems: 'center', color: '#3b82f6', opacity: 0, transition: 'opacity 0.2s', marginLeft: '8px' }}>
                    <ArrowRight style={{ width: '18px', height: '18px' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredAndSortedPathways.length === 0 && (
            <div style={emptyStateStyle}>
              <div style={{ color: '#9ca3af', marginBottom: '8px' }}>No pathways found</div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Try adjusting your search or filters</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <div style={footerContentStyle}>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              Select a pathway to filter your heatmap to show only genes from that pathway
            </div>
            <button
              onClick={onClose}
              style={cancelButtonStyle}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PathwaySelector;