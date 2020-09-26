// A counter simply contains a growing integer.
class Counter {
  constructor() { this.value = 0; }
  increment() { this.value++; }
  incrementBy(n) { this.value += n; }
}

// A distribution tracks a distribution. It only works for positive values,
// and uses exponentially growing buckets.
class DistributionBucket {
  constructor(logBase, index) {
    this.rangeMin = Math.pow(logBase, index) - 1;
    this.rangeMax = Math.pow(logBase, index + 1) - 1;
    this.count = 0;
  }
  record(sample) {
    if (sample < this.rangeMin) throw Error("Sample too small for bucket.");
    if (sample >= this.rangeMax) throw Error("Sample too big for bucket.");
    this.count++;
  }
}

class Distribution {
  constructor(logBase) {
    if (this.logBase <= 1) throw Error("Log base must be greater than 1.");
    this.logBase = logBase;
    this.buckets = [];
    this.sum = 0;
    this.count = 0;
    this.valueMin = NaN;
    this.valueMax = NaN;
  }
  record(sample) {
    if (sample < 0)
      throw Error("No negative values allowed in distributions.");
    // Find the right bucket for this sample, or add more buckets if necessary.
    var bucket = Math.floor(Math.log(1 + sample) / Math.log(this.logBase));
    if (bucket > 1000) throw Error("This sample is too big.");
    for (var i = this.buckets.length; i <= bucket; i++)
      this.buckets[i] = new DistributionBucket(this.logBase, i);
    this.buckets[bucket].record(sample);
    if (this.count == 0 || sample < this.valueMin) this.valueMin = sample;
    if (this.count == 0 || sample > this.valueMax) this.valueMax = sample;
    this.sum += sample;
    this.count++;
  }
  min() { return this.valueMin; }
  max() { return this.valueMax; }
  percentile(n) {
    if (n < 0 || n > 100) throw Error("Invalid percentile number.");
    var countBelow = Math.round(this.count * n / 100);
    var currentCount = 0;
    for (var i = 0, n = this.buckets.length; i < n; i++) {
      var bucket = this.buckets[i];
      var newCount = currentCount + bucket.count;
      if (newCount >= countBelow) {
        // Assume a linear distribution across a bucket and estimate the count.
        var requiredBucketCount = countBelow - currentCount;
        var bucketFraction = requiredBucketCount / bucket.count;
        var bucketOffset = bucketFraction * (bucket.rangeMax - bucket.rangeMin);
        return bucket.rangeMin + bucketOffset;
      } else {
        // The percentile is not in this bucket.
        currentCount = newCount;
      }
    }
    throw Error("Percentile was not found.");
  }
  median() { return percentile(50); }
  mean() { return this.sum / this.count; }
}

var Metrics = (function() {
  var metrics = {};

  function addMetric(name, metric) {
    if (metrics.hasOwnProperty(name))
      throw Error("Metric " + name + " is already defined.");
    metrics[name] = metric;
  }

  function getMetric(name) {
    if (!metrics.hasOwnProperty(name))
      throw Error("Metric " + name + " is not defined.");
    return metrics[name];
  }

  function increment(name) {
    var counter = getMetric(name);
    if (!(counter instanceof Counter)) throw Error(name + " is not a counter.");
    counter.increment();
  }

  function incrementBy(name, value) {
    var counter = getMetric(name);
    if (!(counter instanceof Counter)) throw Error(name + " is not a counter.");
    counter.incrementBy(value);
  }

  function record(name, sample) {
    var distribution = getMetric(name);
    if (!(distribution instanceof Distribution))
      throw Error(name + " is not a distribution.");
    distribution.record(sample);
  }

  return {
    add: addMetric,
    get: getMetric,
    increment: increment,
    incrementBy: incrementBy,
    record: record,
  };
}());
