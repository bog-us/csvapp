import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  className?: string;
  count?: number;
  inline?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  rounded = 'md',
  className = '',
  count = 1,
  inline = false,
}) => {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  const skeletonClass = `animate-pulse bg-gray-200 ${roundedClasses[rounded]} ${className}`;
  const wrapperClass = inline ? 'inline-block' : 'block';

  const generateSkeletons = () => {
    const skeletons = [];
    for (let i = 0; i < count; i++) {
      skeletons.push(
        <div
          key={i}
          className={`${skeletonClass} ${i !== count - 1 ? 'mb-2' : ''}`}
          style={{
            width: typeof width === 'number' ? `${width}px` : width,
            height: typeof height === 'number' ? `${height}px` : height,
          }}
        />
      );
    }
    return skeletons;
  };

  return (
    <div className={wrapperClass}>
      {generateSkeletons()}
    </div>
  );
};

export default Skeleton;