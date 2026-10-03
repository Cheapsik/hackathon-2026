# Wzorce kodu

Pliki, które powstają przy każdym wycinku. Przykład — sale (`Room`) i rezerwacje (`Booking`) — pokazuje wzorzec, nie temat projektu. Kopiując, zmieniasz nazwy i reguły; strukturę, styl i kolejność kroków zostawiasz.

Wszystkie przykłady spełniają reguły z [`01-structure-conventions.md`](01-structure-conventions.md): jawne typy, wynik wywołania w nazwanej zmiennej, metody w klamrach, jeden typ na plik.

## Kolejność pracy nad wycinkiem

1. **Słownik:** nazwy encji, pól i wartości enum z [`../../GLOSSARY.md`](../../GLOSSARY.md), reguły z [`../SPEC.md`](../SPEC.md). Brakujące — dopisz do słownika.
2. **`Domain/<Temat>/`** — encja, enumy, ewentualny typ reguły.
3. **`Persistence/<Temat>/`** — `…Configuration`, `DbSet` w `CastorDbContext`.
4. **Migracja** — `chop dotnet dotnet-ef migrations add <Nazwa> --project src/Castor.Api`, przejrzenie wygenerowanego pliku.
5. **`Queries/<Temat>/`** — tylko jeśli odczyt jest potrzebny w więcej niż jednym handlerze.
6. **`Features/<Zasoby>/`** — żądania, odpowiedź, konwerter, handlery, kontroler.
7. **`Program.cs`** — rejestracja handlerów i zapytań.
8. `chop dotnet build` (zapisuje też `backend/openapi/Castor.Api.json` — commitujesz go razem z kodem), sprawdzenie w Scalar.

## Domain — enum

`Domain/Rooms/RoomStatus.cs`

```csharp
namespace Castor.Api.Domain;

public enum RoomStatus
{
    ACTIVE,
    ARCHIVED,
}
```

## Domain — encja

`Domain/Rooms/Room.cs`

```csharp
namespace Castor.Api.Domain;

/// <summary>
/// A room people book by the hour. An archived room keeps its past bookings and takes no new one.
/// </summary>
public sealed class Room
{
    public const int NameMaxLength = 100;

    private Room()
    {
    }

    public Guid Id { get; private set; }

    public string Name { get; private set; } = null!;

    public int Capacity { get; private set; }

    public RoomStatus Status { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset UpdatedAt { get; private set; }

    public bool IsActive => Status == RoomStatus.ACTIVE;

    public static Room Create(string? name, int capacity, DateTimeOffset createdAt)
    {
        var room = new Room
        {
            Id = Guid.CreateVersion7(),
            Status = RoomStatus.ACTIVE,
            CreatedAt = createdAt,
        };

        room.Rename(name, createdAt);
        room.ChangeCapacity(capacity, createdAt);
        return room;
    }

    public void Rename(string? name, DateTimeOffset changedAt)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new DomainException("A room needs a name.");
        }

        string trimmed = name.Trim();
        if (trimmed.Length > NameMaxLength)
        {
            throw new DomainException($"A room name has at most {NameMaxLength} characters.");
        }

        Name = trimmed;
        UpdatedAt = changedAt;
    }

    public void ChangeCapacity(int capacity, DateTimeOffset changedAt)
    {
        if (capacity < 1)
        {
            throw new DomainException("A room holds at least one person.");
        }

        Capacity = capacity;
        UpdatedAt = changedAt;
    }

    public void Archive(DateTimeOffset changedAt)
    {
        if (!IsActive)
        {
            throw new DomainException("The room is already archived.", StatusCodes.Status409Conflict);
        }

        Status = RoomStatus.ARCHIVED;
        UpdatedAt = changedAt;
    }

    /// <summary>A booking checks its own room before it takes a slot.</summary>
    public void EnsureBookable()
    {
        if (!IsActive)
        {
            throw new DomainException("An archived room cannot be booked.");
        }
    }
}
```

Na co patrzeć:

- prywatny konstruktor dla EF, `private set` wszędzie, stan zmieniają tylko metody;
- fabryka o nazwie czynności nadaje `Id` z `Guid.CreateVersion7()` i woła te same metody co późniejsza edycja — reguła nazwy jest w jednym miejscu;
- zła nazwa to odmowa dla użytkownika (`DomainException`); pusty identyfikator przekazany do fabryki (np. `bookedByUserId` w `Booking.Book` niżej) to błąd programisty (`InvalidOperationException`);
- czas przychodzi parametrem, encja nie woła zegara.

## Domain — encja z nawigacją i warunkiem zapytania

`Domain/Bookings/Booking.cs`

```csharp
using System.Linq.Expressions;

namespace Castor.Api.Domain;

/// <summary>One room reserved for one time slot on one day.</summary>
public sealed class Booking
{
    /// <summary>
    /// The bookings that hold their slot. An expression, so the same rule filters rows in the database
    /// and is never rewritten by hand in a query.
    /// </summary>
    public static readonly Expression<Func<Booking, bool>> HoldsSlot = booking =>
        booking.Status == BookingStatus.CONFIRMED;

    private Booking()
    {
    }

    public Guid Id { get; private set; }

    public Guid RoomId { get; private set; }

    public Room Room { get; private set; } = null!;

    public Guid BookedByUserId { get; private set; }

    public DateOnly Day { get; private set; }

    public TimeOnly StartsAt { get; private set; }

    public TimeOnly EndsAt { get; private set; }

    public BookingStatus Status { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset UpdatedAt { get; private set; }

    public static Booking Book(
        Room room,
        Guid bookedByUserId,
        DateOnly day,
        TimeOnly startsAt,
        TimeOnly endsAt,
        DateTimeOffset createdAt)
    {
        ArgumentNullException.ThrowIfNull(room);

        if (bookedByUserId == Guid.Empty)
        {
            throw new InvalidOperationException("The user id of a new booking is empty.");
        }

        room.EnsureBookable();
        EnsureSlot(startsAt, endsAt);

        return new Booking
        {
            Id = Guid.CreateVersion7(),
            RoomId = room.Id,
            Room = room,
            BookedByUserId = bookedByUserId,
            Day = day,
            StartsAt = startsAt,
            EndsAt = endsAt,
            Status = BookingStatus.CONFIRMED,
            CreatedAt = createdAt,
            UpdatedAt = createdAt,
        };
    }

    /// <summary>Needs <see cref="Room"/> loaded: a slot moves only within a room that still takes bookings.</summary>
    public void Reschedule(DateOnly day, TimeOnly startsAt, TimeOnly endsAt, DateTimeOffset changedAt)
    {
        EnsureConfirmed();
        Room.EnsureBookable();
        EnsureSlot(startsAt, endsAt);

        Day = day;
        StartsAt = startsAt;
        EndsAt = endsAt;
        UpdatedAt = changedAt;
    }

    public void Cancel(DateTimeOffset changedAt)
    {
        EnsureConfirmed();

        Status = BookingStatus.CANCELLED;
        UpdatedAt = changedAt;
    }

    /// <summary>Slots touching at an edge (9:00–10:00 and 10:00–11:00) do not overlap.</summary>
    public bool Overlaps(DateOnly day, TimeOnly startsAt, TimeOnly endsAt)
    {
        return Day == day && StartsAt < endsAt && startsAt < EndsAt;
    }

    private static void EnsureSlot(TimeOnly startsAt, TimeOnly endsAt)
    {
        if (endsAt <= startsAt)
        {
            throw new DomainException("A booking ends after it starts.");
        }
    }

    private void EnsureConfirmed()
    {
        if (Status != BookingStatus.CONFIRMED)
        {
            throw new DomainException("A cancelled booking cannot change.", StatusCodes.Status409Conflict);
        }
    }
}
```

Rezerwacja sprawdza swoją salę, bo ją ma (nawigacja). **Nie** sprawdza, czy termin jest wolny — to zależy od innych rezerwacji, czyli danych spoza niej.

## Domain — typ reguły używanej przez kilka handlerów

„Termin sali jest wolny” potrzebują `CreateBookingHandler` i `RescheduleBookingHandler`. Reguła dostaje dane, na których decyduje, i jest testowalna bez bazy.

`Domain/Bookings/RoomSchedule.cs`

```csharp
namespace Castor.Api.Domain;

/// <summary>
/// The bookings holding a slot in one room on one day, and whether another slot still fits between them.
/// </summary>
public sealed class RoomSchedule
{
    private readonly IReadOnlyList<Booking> bookingsHoldingSlot;

    public RoomSchedule(IReadOnlyList<Booking> bookingsHoldingSlot)
    {
        ArgumentNullException.ThrowIfNull(bookingsHoldingSlot);

        this.bookingsHoldingSlot = bookingsHoldingSlot;
    }

    /// <param name="movedBookingId">A booking being rescheduled does not collide with its own old slot.</param>
    public void EnsureFree(DateOnly day, TimeOnly startsAt, TimeOnly endsAt, Guid? movedBookingId)
    {
        bool taken = bookingsHoldingSlot.Any(booking =>
            booking.Id != movedBookingId && booking.Overlaps(day, startsAt, endsAt));

        if (taken)
        {
            throw new DomainException("The room is already booked at that time.", StatusCodes.Status409Conflict);
        }
    }
}
```

## Persistence — mapowanie

`Persistence/Rooms/RoomConfiguration.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Castor.Api.Persistence;

public sealed class RoomConfiguration : IEntityTypeConfiguration<Room>
{
    public void Configure(EntityTypeBuilder<Room> builder)
    {
        builder.HasKey(room => room.Id);

        builder.Property(room => room.Name).HasMaxLength(Room.NameMaxLength);

        builder.HasIndex(room => room.Name)
            .IsUnique()
            .HasDatabaseName("IX_Rooms_UniqueName");

        builder.ToTable(table =>
        {
            table.HasCheckConstraint("CK_Rooms_Capacity_Positive", "\"Capacity\" >= 1");
        });
    }
}
```

`Persistence/Bookings/BookingConfiguration.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Castor.Api.Persistence;

public sealed class BookingConfiguration : IEntityTypeConfiguration<Booking>
{
    public void Configure(EntityTypeBuilder<Booking> builder)
    {
        builder.HasKey(booking => booking.Id);

        builder.HasOne(booking => booking.Room)
            .WithMany()
            .HasForeignKey(booking => booking.RoomId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(booking => booking.BookedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(booking => new { booking.RoomId, booking.Day });

        builder.ToTable(table =>
        {
            table.HasCheckConstraint("CK_Bookings_EndsAfterStart", "\"EndsAt\" > \"StartsAt\"");
        });
    }
}
```

Precyzji, enumów jako tekstu ani `ValueGenerated.Never` tu nie ustawiasz — robią to globalne konwencje ze szkieletu. W `CastorDbContext` dopisujesz:

```csharp
public DbSet<Room> Rooms => Set<Room>();

public DbSet<Booking> Bookings => Set<Booking>();
```

Po migracji sprawdzasz w wygenerowanym pliku: tabelę, klucz obcy do sali, indeks unikalny, `CHECK`, kolumnę `Status` jako `text`, brak indeksu zdublowanego przez inny.

## Queries — odczyt wspólny

`Queries/Bookings/RoomScheduleQuery.cs`

```csharp
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Queries;

/// <summary>The bookings that hold a slot in one room on one day, for the rule that decides whether a slot is free.</summary>
public sealed class RoomScheduleQuery(CastorDbContext db)
{
    public async Task<RoomSchedule> OfDayAsync(Guid roomId, DateOnly day, CancellationToken cancellationToken)
    {
        List<Booking> bookings = await db.Bookings
            .AsNoTracking()
            .Where(Booking.HoldsSlot)
            .Where(booking => booking.RoomId == roomId && booking.Day == day)
            .ToListAsync(cancellationToken);

        return new RoomSchedule(bookings);
    }
}
```

Warunek „trzyma termin” pochodzi z `Booking.HoldsSlot`, nie jest przepisany.

## Features — żądania i odpowiedź

`Features/Bookings/CreateBookingRequest.cs`

```csharp
namespace Castor.Api.Features.Bookings;

public sealed record CreateBookingRequest(Guid RoomId, DateOnly Day, TimeOnly StartsAt, TimeOnly EndsAt);
```

`Features/Bookings/RescheduleBookingRequest.cs`

```csharp
namespace Castor.Api.Features.Bookings;

public sealed record RescheduleBookingRequest(DateOnly Day, TimeOnly StartsAt, TimeOnly EndsAt);
```

`Features/Bookings/ListBookingsRequest.cs`

```csharp
namespace Castor.Api.Features.Bookings;

/// <param name="Status">CONFIRMED or CANCELLED; all bookings when left out.</param>
public sealed record ListBookingsRequest(DateOnly? Day, string? Status);
```

`Features/Rooms/CreateRoomRequest.cs`

```csharp
namespace Castor.Api.Features.Rooms;

/// <param name="Capacity">Nullable on purpose: a field missing from the JSON must be refused, not read as 0.</param>
public sealed record CreateRoomRequest(string? Name, int? Capacity);
```

`Features/Bookings/BookingResponse.cs`

```csharp
namespace Castor.Api.Features.Bookings;

public sealed record BookingResponse(
    Guid Id,
    Guid RoomId,
    DateOnly Day,
    TimeOnly StartsAt,
    TimeOnly EndsAt,
    string Status);
```

`Features/Rooms/RoomResponse.cs` — analogicznie, z `RoomConverter.ToResponse()` obok:

```csharp
namespace Castor.Api.Features.Rooms;

public sealed record RoomResponse(Guid Id, string Name, int Capacity, string Status);
```

## Features — konwerter

`Features/Bookings/BookingConverter.cs`

```csharp
namespace Castor.Api.Features.Bookings;

internal static class BookingConverter
{
    public static BookingResponse ToResponse(this Booking booking)
    {
        string status = booking.Status.ToString();

        return new(booking.Id, booking.RoomId, booking.Day, booking.StartsAt, booking.EndsAt, status);
    }
}
```

Konwerter przepisuje pola. Nie czyta bazy, nie liczy reguł.

## Features — handler zapisu

`Features/Bookings/CreateBookingHandler.cs`

```csharp
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Bookings;

public sealed class CreateBookingHandler(
    CastorDbContext db,
    CurrentUser currentUser,
    RoomScheduleQuery roomSchedule,
    IClock clock)
{
    public async Task<BookingResponse> HandleAsync(CreateBookingRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        Room room = await db.Rooms.SingleOrDefaultAsync(candidate => candidate.Id == request.RoomId, cancellationToken)
            ?? throw new DomainException("The room does not exist.", StatusCodes.Status404NotFound);

        RoomSchedule schedule = await roomSchedule.OfDayAsync(room.Id, request.Day, cancellationToken);
        schedule.EnsureFree(request.Day, request.StartsAt, request.EndsAt, movedBookingId: null);

        var booking = Booking.Book(room, currentUser.UserId, request.Day, request.StartsAt, request.EndsAt, clock.UtcNow);
        db.Bookings.Add(booking);

        await db.SaveChangesAsync(cancellationToken);

        return booking.ToResponse();
    }
}
```

Kroki zawsze w tej kolejności: wczytanie (404, jeśli brak) → reguły → zmiana przez metodę encji → `SaveChanges` → odpowiedź.

„Termin jest wolny” to reguła „odczytaj, sprawdź, zapisz”, której baza nie wyraża constraintem — dwa równoczesne żądania mogą ją razem złamać. Mechanizm przeciw temu wybiera zespół przy pierwszej takiej regule w produkcie ([`01-structure-conventions.md`](01-structure-conventions.md) · Równoczesne zapisy).

`Features/Bookings/RescheduleBookingHandler.cs`

```csharp
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Bookings;

public sealed class RescheduleBookingHandler(
    CastorDbContext db,
    RoomScheduleQuery roomSchedule,
    IClock clock)
{
    public async Task<BookingResponse> HandleAsync(
        Guid bookingId,
        RescheduleBookingRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        Booking booking = await db.Bookings
                .Include(candidate => candidate.Room)
                .SingleOrDefaultAsync(candidate => candidate.Id == bookingId, cancellationToken)
            ?? throw new DomainException("The booking does not exist.", StatusCodes.Status404NotFound);

        RoomSchedule schedule = await roomSchedule.OfDayAsync(booking.RoomId, request.Day, cancellationToken);
        schedule.EnsureFree(request.Day, request.StartsAt, request.EndsAt, booking.Id);

        booking.Reschedule(request.Day, request.StartsAt, request.EndsAt, clock.UtcNow);

        await db.SaveChangesAsync(cancellationToken);

        return booking.ToResponse();
    }
}
```

## Features — handler zapisu z unikalnością i polem nullowalnym

`Features/Rooms/CreateRoomHandler.cs`

```csharp
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Rooms;

public sealed class CreateRoomHandler(CastorDbContext db, IClock clock)
{
    public async Task<RoomResponse> HandleAsync(CreateRoomRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.Capacity is not int capacity)
        {
            throw new DomainException("A room needs a capacity.");
        }

        var room = Room.Create(request.Name, capacity, clock.UtcNow);
        db.Rooms.Add(room);

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (PostgresErrors.IsUniqueViolation(exception))
        {
            throw new DomainException("A room with this name already exists.", StatusCodes.Status409Conflict);
        }

        return room.ToResponse();
    }
}
```

Unikalność nazwy sprawdza indeks w bazie, nie zapytanie przed zapisem — dzięki temu dwa równoczesne żądania nie przejdą obu. Jeśli handler otwiera jawną transakcję, deklaruje ją przed `try`: `await using` w środku `try` zamknąłby ją, zanim kod wejdzie do `catch`.

## Features — handler odczytu

`Features/Bookings/ListBookingsHandler.cs`

```csharp
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Bookings;

public sealed class ListBookingsHandler(CastorDbContext db)
{
    public async Task<IReadOnlyList<BookingResponse>> HandleAsync(
        ListBookingsRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        IQueryable<Booking> query = db.Bookings.AsNoTracking();

        if (request.Day is DateOnly day)
        {
            query = query.Where(booking => booking.Day == day);
        }

        if (request.Status is not null)
        {
            if (!NamedEnum.TryParse(request.Status, out BookingStatus status))
            {
                throw new DomainException("Status is CONFIRMED or CANCELLED.");
            }

            query = query.Where(booking => booking.Status == status);
        }

        List<Booking> bookings = await query
            .OrderBy(booking => booking.Day)
            .ThenBy(booking => booking.StartsAt)
            .ToListAsync(cancellationToken);

        return bookings.Select(booking => booking.ToResponse()).ToList();
    }
}
```

Handler tylko czytający nie otwiera transakcji. Lista jest odczytem jednego handlera, więc zostaje w nim — nie trafia do `Queries/`.

`Features/Bookings/GetBookingHandler.cs`

```csharp
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Bookings;

public sealed class GetBookingHandler(CastorDbContext db)
{
    public async Task<BookingResponse> HandleAsync(Guid bookingId, CancellationToken cancellationToken)
    {
        Booking booking = await db.Bookings
                .AsNoTracking()
                .SingleOrDefaultAsync(candidate => candidate.Id == bookingId, cancellationToken)
            ?? throw new DomainException("The booking does not exist.", StatusCodes.Status404NotFound);

        return booking.ToResponse();
    }
}
```

Gdy produkt zawęża, kto widzi zasób (np. tylko autor i administrator), handler dopisuje ten warunek jawnie, a zasób niedostępny daje to samo 404 co nieistniejący — [`00-stack.md`](00-stack.md) · Dostęp do danych.

## Features — zmiana atrybutów (PATCH)

Pola niezależne od siebie zmienia `PATCH`. Wszystkie pola żądania są nullowalne, a **`null` znaczy „nie zmieniaj”** — [`01-structure-conventions.md`](01-structure-conventions.md) · Zmiana i usuwanie.

`Features/Rooms/UpdateRoomRequest.cs`

```csharp
namespace Castor.Api.Features.Rooms;

/// <summary>Only the fields present change.</summary>
public sealed record UpdateRoomRequest(string? Name, int? Capacity);
```

`Features/Rooms/UpdateRoomHandler.cs`

```csharp
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Rooms;

public sealed class UpdateRoomHandler(CastorDbContext db, IClock clock)
{
    public async Task<RoomResponse> HandleAsync(Guid roomId, UpdateRoomRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        Room room = await db.Rooms.SingleOrDefaultAsync(candidate => candidate.Id == roomId, cancellationToken)
            ?? throw new DomainException("The room does not exist.", StatusCodes.Status404NotFound);

        DateTimeOffset now = clock.UtcNow;

        if (request.Name is not null)
        {
            room.Rename(request.Name, now);
        }

        if (request.Capacity is int capacity)
        {
            room.ChangeCapacity(capacity, now);
        }

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (PostgresErrors.IsUniqueViolation(exception))
        {
            throw new DomainException("A room with this name already exists.", StatusCodes.Status409Conflict);
        }

        return room.ToResponse();
    }
}
```

Każde obecne pole idzie przez tę samą metodę encji co przy tworzeniu (`Rename`, `ChangeCapacity`), więc reguła pola jest w jednym miejscu. Pusty string w `Name` nie jest „brakiem” — trafia do `Rename` i dostaje odmowę.

**Pełna treść zamiast pojedynczych pól** — gdy pola zależą od siebie, jak dzień i godziny rezerwacji — to `RescheduleBookingHandler` wyżej: żądanie z kompletem wymaganych pól i jedna metoda encji, która sprawdza je razem. Bez domenowego czasownika ten sam wzorzec nazywa się `PUT /<zasoby>/{id}` + `Revise<Zasób>Handler` ← `Revise<Zasób>Request`.

## Features — archiwizacja z odmową 409

Na salę wskazują rezerwacje, więc sali się nie usuwa — archiwizuje się ją. Warunek „nie ma nadchodzących rezerwacji” zależy od danych spoza encji i potrzebuje go tylko ten handler, więc sprawdza go handler.

`Features/Rooms/ArchiveRoomHandler.cs`

```csharp
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Rooms;

public sealed class ArchiveRoomHandler(CastorDbContext db, IClock clock)
{
    public async Task<RoomResponse> HandleAsync(Guid roomId, CancellationToken cancellationToken)
    {
        Room room = await db.Rooms.SingleOrDefaultAsync(candidate => candidate.Id == roomId, cancellationToken)
            ?? throw new DomainException("The room does not exist.", StatusCodes.Status404NotFound);

        DateTimeOffset now = clock.UtcNow;
        await EnsureNoUpcomingBookingsAsync(room, now, cancellationToken);
        room.Archive(now);

        await db.SaveChangesAsync(cancellationToken);

        return room.ToResponse();
    }

    /// <summary>
    /// Past bookings stay with the archived room as history; an upcoming one would hold a slot in a room
    /// nobody can book any more.
    /// </summary>
    private async Task EnsureNoUpcomingBookingsAsync(Room room, DateTimeOffset now, CancellationToken cancellationToken)
    {
        // The business date in UTC; a product with a time zone setting takes today from it.
        DateOnly today = DateOnly.FromDateTime(now.UtcDateTime);

        bool hasUpcomingBookings = await db.Bookings
            .Where(Booking.HoldsSlot)
            .AnyAsync(booking => booking.RoomId == room.Id && booking.Day >= today, cancellationToken);

        if (hasUpcomingBookings)
        {
            throw new DomainException(
                "The room has upcoming bookings. Cancel or move them before archiving the room.",
                StatusCodes.Status409Conflict);
        }
    }
}
```

Naruszenia klucza obcego nigdzie nie łapiemy: gdyby wystąpiło, znaczyłoby, że handler zapomniał sprawdzić zależności, i ma wyjść jako 500.

## Features — usunięcie liścia

`Features/Bookings/DeleteBookingHandler.cs`

```csharp
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Bookings;

public sealed class DeleteBookingHandler(CastorDbContext db)
{
    /// <summary>
    /// Nothing points at a booking, so it is removed outright — for one entered by mistake. Cancelling keeps it
    /// as history instead.
    /// </summary>
    public async Task HandleAsync(Guid bookingId, CancellationToken cancellationToken)
    {
        Booking booking = await db.Bookings.SingleOrDefaultAsync(candidate => candidate.Id == bookingId, cancellationToken)
            ?? throw new DomainException("The booking does not exist.", StatusCodes.Status404NotFound);

        db.Bookings.Remove(booking);
        await db.SaveChangesAsync(cancellationToken);
    }
}
```

## Features — kontroler

`Features/Bookings/BookingsController.cs`

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Castor.Api.Features.Bookings;

[ApiController]
[Authorize]
[Route("bookings")]
public sealed class BookingsController(
    CreateBookingHandler create,
    RescheduleBookingHandler reschedule,
    CancelBookingHandler cancel,
    DeleteBookingHandler delete,
    GetBookingHandler get,
    ListBookingsHandler list) : ControllerBase
{
    [HttpGet]
    public Task<IReadOnlyList<BookingResponse>> Get(
        [FromQuery] ListBookingsRequest request,
        CancellationToken cancellationToken)
    {
        return list.HandleAsync(request, cancellationToken);
    }

    [HttpGet("{bookingId:guid}")]
    public Task<BookingResponse> GetById(Guid bookingId, CancellationToken cancellationToken)
    {
        return get.HandleAsync(bookingId, cancellationToken);
    }

    [HttpPost]
    [ProducesResponseType<BookingResponse>(StatusCodes.Status201Created)]
    public async Task<ActionResult<BookingResponse>> Post(
        [FromBody] CreateBookingRequest request,
        CancellationToken cancellationToken)
    {
        BookingResponse booking = await create.HandleAsync(request, cancellationToken);

        return Created($"/api/bookings/{booking.Id}", booking);
    }

    [HttpPost("{bookingId:guid}/reschedule")]
    public Task<BookingResponse> Reschedule(
        Guid bookingId,
        [FromBody] RescheduleBookingRequest request,
        CancellationToken cancellationToken)
    {
        return reschedule.HandleAsync(bookingId, request, cancellationToken);
    }

    [HttpPost("{bookingId:guid}/cancel")]
    public Task<BookingResponse> Cancel(Guid bookingId, CancellationToken cancellationToken)
    {
        return cancel.HandleAsync(bookingId, cancellationToken);
    }

    [HttpDelete("{bookingId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(Guid bookingId, CancellationToken cancellationToken)
    {
        await delete.HandleAsync(bookingId, cancellationToken);

        return NoContent();
    }
}
```

`Features/Rooms/RoomsController.cs`

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Castor.Api.Features.Rooms;

[ApiController]
[Authorize]
[Route("rooms")]
public sealed class RoomsController(
    CreateRoomHandler create,
    UpdateRoomHandler update,
    ArchiveRoomHandler archive) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType<RoomResponse>(StatusCodes.Status201Created)]
    public async Task<ActionResult<RoomResponse>> Post(
        [FromBody] CreateRoomRequest request,
        CancellationToken cancellationToken)
    {
        RoomResponse room = await create.HandleAsync(request, cancellationToken);

        return Created($"/api/rooms/{room.Id}", room);
    }

    [HttpPatch("{roomId:guid}")]
    public Task<RoomResponse> Patch(Guid roomId, [FromBody] UpdateRoomRequest request, CancellationToken cancellationToken)
    {
        return update.HandleAsync(roomId, request, cancellationToken);
    }

    [HttpPost("{roomId:guid}/archive")]
    public Task<RoomResponse> Archive(Guid roomId, CancellationToken cancellationToken)
    {
        return archive.HandleAsync(roomId, cancellationToken);
    }
}
```

Trasy w tabeli są względne: `ApiRoutePrefixConvention` dokleja do każdej `/api`. Kod inny niż 200 deklaruje `[ProducesResponseType]`, bo z dokumentu OpenAPI powstaje klient frontendu.

| Czynność | HTTP | Handler | Odpowiedź |
|---|---|---|---|
| Lista | `GET /<zasoby>` z filtrami w query | `List…` | 200 + tablica |
| Szczegóły | `GET /<zasoby>/{id}` | `Get…` | 200 / 404 |
| Utworzenie | `POST /<zasoby>` | `Create…` | 201 + obiekt |
| Zmiana niezależnych pól | `PATCH /<zasoby>/{id}` — `null` = bez zmian | `Update…` | 200 + obiekt |
| Podmiana całej treści | `PUT /<zasoby>/{id}` — pola wymagane | `Revise…` | 200 + obiekt |
| Czynność domenowa | `POST /<zasoby>/{id}/<czynność>` | `Cancel…`, `Reschedule…` | 200 + obiekt |
| Archiwizacja (coś na encję wskazuje) | `POST /<zasoby>/{id}/archive` | `Archive…` | 200 + obiekt / 409 |
| Usunięcie (liść) | `DELETE /<zasoby>/{id}` | `Delete…` | 204 / 409 |

Handler bez treści żądania (szczegóły, usunięcie, czynność bez danych) przyjmuje tylko parametry trasy. `CancelBookingHandler` wygląda jak `RescheduleBookingHandler` bez żądania i bez `RoomScheduleQuery`: wczytanie (404), `booking.Cancel(clock.UtcNow)`, zapis.

## Program.cs — rejestracja

Każdy nowy handler i zapytanie rejestrujesz jawnie, w bloku swojego zasobu:

```csharp
builder.Services.AddScoped<CreateRoomHandler>();
builder.Services.AddScoped<UpdateRoomHandler>();
builder.Services.AddScoped<ArchiveRoomHandler>();

builder.Services.AddScoped<RoomScheduleQuery>();
builder.Services.AddScoped<CreateBookingHandler>();
builder.Services.AddScoped<RescheduleBookingHandler>();
builder.Services.AddScoped<CancelBookingHandler>();
builder.Services.AddScoped<DeleteBookingHandler>();
builder.Services.AddScoped<GetBookingHandler>();
builder.Services.AddScoped<ListBookingsHandler>();
```
