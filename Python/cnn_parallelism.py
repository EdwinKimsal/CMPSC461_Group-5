from torch.utils.data import DataLoader

# ...

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    valid_loader = DataLoader(valid_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)
    # ...
    return train_loader, valid_loader, test_loader, T_MAX, OUT_CLASSES

# ...

    train_loader, valid_loader, test_loader, T_MAX, OUT_CLASSES = nn_lib.create_objs(DATA_DIR, img, train, validate, test, CROPSIZE, BATCH_SIZE, EPOCHS, img_type)
    nn_lib.output(EPOCHS, model, train_loader, valid_loader, test_loader)