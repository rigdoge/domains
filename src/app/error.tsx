'use client';

export default function Error() {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => window.location.reload()}>
        Try again
      </button>
    </div>
  );
} 