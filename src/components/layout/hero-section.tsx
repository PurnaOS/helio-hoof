/**
 * Server component for the static hero section
 * Contains only static content that doesn't require client-side JavaScript
 */
export function HeroSection() {
  return (
    <div className="text-center mb-8">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        Show Jumping Analyzer
      </h2>
      <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
        Upload single or multiple show jumping images for expert equestrian
        analysis. Get detailed feedback on rider technique, horse performance,
        and partnership dynamics with comparative analysis across multiple
        images.
      </p>
    </div>
  );
}
