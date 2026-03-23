import flwr as fl

def main():
    # Define strategy for federated aggregation
    strategy = fl.server.strategy.FedAvg(
        fraction_fit=1.0,  # Sample 100% of available clients for training
        fraction_evaluate=1.0,  # Sample 100% of available clients for verification
        min_fit_clients=2,  # Wait for at least 2 bank clients
        min_evaluate_clients=2, 
        min_available_clients=2,
    )

    print("Satark Federated Learning Aggregator Node Initialized.")
    print("Listening for Bank Edge nodes on 0.0.0.0:8080...")

    # Start the server
    fl.server.start_server(
        server_address="0.0.0.0:8080",
        config=fl.server.ServerConfig(num_rounds=3),
        strategy=strategy,
    )

if __name__ == "__main__":
    main()
