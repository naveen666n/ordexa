import { Check } from 'lucide-react';

const STEPS = ['paid', 'processing', 'shipped', 'delivered'];

const STEP_LABELS = {
  paid: 'Paid',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
};

const OrderStatusStepper = ({ status }) => {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center justify-center py-4">
        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-red-100 text-red-700 border border-red-200">
          Cancelled
        </span>
      </div>
    );
  }

  const currentIndex = STEPS.indexOf(status);

  return (
    <div className="w-full py-4">
      {/* Desktop: horizontal */}
      <div className="hidden sm:flex items-center w-full">
        {STEPS.map((step, index) => {
          const isCompleted = currentIndex > index;
          const isCurrent = currentIndex === index;
          const isFuture = currentIndex < index;

          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              {/* Step circle + label */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all
                    ${isCompleted ? 'bg-green-500 border-green-500' : ''}
                    ${isCurrent ? 'bg-indigo-600 border-indigo-600' : ''}
                    ${isFuture ? 'bg-white border-gray-300' : ''}
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  ) : isCurrent ? (
                    <div className="w-3 h-3 rounded-full bg-white" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-gray-300" />
                  )}
                </div>
                <span
                  className={`mt-2 text-xs whitespace-nowrap
                    ${isCompleted ? 'text-green-600 font-medium' : ''}
                    ${isCurrent ? 'text-indigo-700 font-bold' : ''}
                    ${isFuture ? 'text-gray-400' : ''}
                  `}
                >
                  {STEP_LABELS[step]}
                </span>
              </div>

              {/* Connector line (not after last step) */}
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 mb-5 transition-all
                    ${isCompleted ? 'bg-green-400' : 'bg-gray-200'}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical */}
      <div className="flex sm:hidden flex-col gap-0">
        {STEPS.map((step, index) => {
          const isCompleted = currentIndex > index;
          const isCurrent = currentIndex === index;
          const isFuture = currentIndex < index;

          return (
            <div key={step} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0
                    ${isCompleted ? 'bg-green-500 border-green-500' : ''}
                    ${isCurrent ? 'bg-indigo-600 border-indigo-600' : ''}
                    ${isFuture ? 'bg-white border-gray-300' : ''}
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  ) : isCurrent ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-0.5 h-6 ${isCompleted ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
              <div className="pt-1 pb-4">
                <span
                  className={`text-sm
                    ${isCompleted ? 'text-green-600 font-medium' : ''}
                    ${isCurrent ? 'text-indigo-700 font-bold' : ''}
                    ${isFuture ? 'text-gray-400' : ''}
                  `}
                >
                  {STEP_LABELS[step]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderStatusStepper;
