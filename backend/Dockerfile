FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY global.json Directory.Build.props .editorconfig ./
COPY src/Castor.Api/Castor.Api.csproj src/Castor.Api/
RUN dotnet restore src/Castor.Api/Castor.Api.csproj

COPY src/ src/
# The OpenAPI document is generated on a developer build and committed; the image does not need it.
RUN dotnet publish src/Castor.Api/Castor.Api.csproj -c Release -o /app --no-restore -p:OpenApiGenerateDocuments=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app

# Data protection keys live on a volume, so a restart does not sign everybody out.
RUN mkdir -p /var/castor/keys && chown app /var/castor/keys

COPY --from=build /app .

ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
USER app
ENTRYPOINT ["dotnet", "Castor.Api.dll"]
