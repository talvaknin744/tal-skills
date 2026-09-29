#pragma once
#include <memory>
#include <string>

struct ReceiptSink {
    virtual ~ReceiptSink() = default;
    virtual void append(const std::string& line) = 0;
};

// Supplied by the deployment adapter. Construction opens the billing service
// connection and registers a batch; neither operation is available locally.
struct RemoteReceiptSink : ReceiptSink {
    RemoteReceiptSink();
    void append(const std::string& line) override;
};

class ReceiptBatch {
public:
    ReceiptBatch() : sink_(makeSink()) {}
    virtual ~ReceiptBatch() = default;

    void record(const std::string& invoice, int totalCents) {
        sink_->append(invoice + ":" + std::to_string(totalCents));
    }

protected:
    virtual std::unique_ptr<ReceiptSink> makeSink() {
        return std::make_unique<RemoteReceiptSink>();
    }

private:
    std::unique_ptr<ReceiptSink> sink_;
};
